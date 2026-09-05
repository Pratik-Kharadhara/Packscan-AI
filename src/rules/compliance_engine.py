"""Configurable, explainable first-level package screening decisions."""

from __future__ import annotations

import re
from enum import StrEnum

from pydantic import BaseModel

from src.detection.base_detector import DetectedField
from src.quality.image_quality import ImageQualityResult
from src.rules.rule_loader import ComplianceRules, RuleLoader


class CheckStatus(StrEnum):
    """A field-level screening outcome."""

    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class OverallStatus(StrEnum):
    """The project's only permitted overall screening outcomes."""

    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class ComplianceCheck(BaseModel):
    """One explainable field-level screening outcome."""

    field: str
    status: CheckStatus
    reason: str


class ComplianceResult(BaseModel):
    """Rule-engine result; it is decision support, not an inspection finding."""

    overall_status: OverallStatus
    checks: list[ComplianceCheck]
    summary: str


class ComplianceEngine:
    """Apply an external screening profile to quality and OCR-derived evidence."""

    def __init__(self, rules: ComplianceRules | None = None) -> None:
        self._rules = rules or RuleLoader().load()

    def evaluate(
        self,
        image_quality: ImageQualityResult,
        detected_fields: dict[str, DetectedField],
    ) -> ComplianceResult:
        """Evaluate evidence with conservative, confidence-aware decision logic."""

        checks: list[ComplianceCheck] = []
        if not image_quality.usable:
            checks.append(
                ComplianceCheck(
                    field="image_quality",
                    status=CheckStatus.REVIEW,
                    reason="; ".join(image_quality.issues),
                )
            )

        for field_name, rule in self._rules.fields.items():
            if not rule.required:
                checks.append(
                    ComplianceCheck(
                        field=field_name,
                        status=CheckStatus.NOT_APPLICABLE,
                        reason="This declaration is not required by the active screening profile.",
                    )
                )
                continue

            detected = detected_fields.get(field_name)
            checks.append(self._evaluate_field(field_name, rule, detected, image_quality.usable))

        return ComplianceResult(
            overall_status=self._derive_overall_status(checks),
            checks=checks,
            summary=self._build_summary(checks),
        )

    @staticmethod
    def _evaluate_field(
        field_name: str,
        rule: object,
        detected: DetectedField | None,
        image_usable: bool,
    ) -> ComplianceCheck:
        # Rule's concrete type is intentionally consumed through its configured attributes.
        if not image_usable:
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.REVIEW,
                reason="Image quality is insufficient for a reliable automated field conclusion.",
            )
        if detected is None or not detected.found:
            status = CheckStatus(getattr(rule, "missing_status"))
            return ComplianceCheck(
                field=field_name,
                status=status,
                reason=(
                    "No reliable declaration was detected. Manual verification is required."
                    if status is CheckStatus.REVIEW
                    else "Required declaration was reliably determined to be absent."
                ),
            )
        if detected.confidence is None or detected.confidence < getattr(rule, "minimum_confidence"):
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.REVIEW,
                reason=(
                    f"Declaration detected with confidence {detected.confidence or 0:.2f}, below "
                    f"the configured minimum of {getattr(rule, 'minimum_confidence'):.2f}."
                ),
            )
        if not detected.value or not re.fullmatch(getattr(rule, "value_pattern"), detected.value, re.IGNORECASE):
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.FAIL,
                reason="Detected declaration does not match the configured required format.",
            )
        return ComplianceCheck(
            field=field_name,
            status=CheckStatus.PASS,
            reason=f"Declaration detected: {detected.value}",
        )

    @staticmethod
    def _derive_overall_status(checks: list[ComplianceCheck]) -> OverallStatus:
        statuses = {check.status for check in checks}
        if CheckStatus.FAIL in statuses:
            return OverallStatus.NON_COMPLIANT
        if CheckStatus.REVIEW in statuses:
            return OverallStatus.NEEDS_REVIEW
        return OverallStatus.COMPLIANT

    @staticmethod
    def _build_summary(checks: list[ComplianceCheck]) -> str:
        statuses = {check.status for check in checks}
        if CheckStatus.FAIL in statuses:
            return "One or more configured checks clearly failed. Review the evidence before taking action."
        if CheckStatus.REVIEW in statuses:
            return "Manual verification is recommended because one or more declarations are unclear."
        return "All declarations required by the active screening profile passed the configured checks."
