"""Configurable, explainable first-level package screening decisions."""

from __future__ import annotations

import re
from enum import StrEnum

from pydantic import BaseModel, Field

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
    """One explainable field-level screening outcome grounded in statutory rules."""

    field: str
    status: CheckStatus
    reason: str
    rule_reference: str | None = None
    evidence: str | None = None
    sub_fields: dict[str, str] = Field(default_factory=dict)


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
            ref = getattr(rule, "rule_reference", None)
            if not rule.required:
                checks.append(
                    ComplianceCheck(
                        field=field_name,
                        status=CheckStatus.NOT_APPLICABLE,
                        reason="This declaration is not required by the active screening profile.",
                        rule_reference=ref,
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
        ref = getattr(rule, "rule_reference", None) or (detected.rule_reference if detected else None)
        sub_fields = detected.sub_fields if detected else {}
        evidence = detected.matched_text or detected.raw_text if detected else None

        if not image_usable:
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.REVIEW,
                reason="Image quality is insufficient for a reliable automated field conclusion.",
                rule_reference=ref,
                evidence=evidence,
                sub_fields=sub_fields,
            )

        if detected is None or not detected.found:
            status = CheckStatus(getattr(rule, "missing_status"))
            prefix = f"{ref}: " if ref else ""
            return ComplianceCheck(
                field=field_name,
                status=status,
                reason=(
                    f"{prefix}No reliable declaration detected on scanned panel. Manual verification recommended."
                    if status is CheckStatus.REVIEW
                    else f"{prefix}Required declaration determined to be absent from scanned panel."
                ),
                rule_reference=ref,
                evidence=evidence,
                sub_fields=sub_fields,
            )

        # Handle semantic date separation: only expiry date detected when mfg/pkg date is required (Rule 6(1)(d))
        if field_name == "manufacture_date" and sub_fields.get("date_type") == "expiry_only":
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.REVIEW,
                reason=f"{ref or 'Rule 6(1)(d)'}: Expiry date detected ({detected.value}), but mandatory month & year of manufacture/pre-packing is missing.",
                rule_reference=ref,
                evidence=evidence,
                sub_fields=sub_fields,
            )

        if detected.confidence is None or detected.confidence < getattr(rule, "minimum_confidence"):
            prefix = f"{ref}: " if ref else ""
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.REVIEW,
                reason=(
                    f"{prefix}Declaration detected with confidence {detected.confidence or 0:.2f}, below "
                    f"configured threshold of {getattr(rule, 'minimum_confidence'):.2f}."
                ),
                rule_reference=ref,
                evidence=evidence,
                sub_fields=sub_fields,
            )

        if not detected.value or not re.fullmatch(getattr(rule, "value_pattern"), detected.value, re.IGNORECASE):
            prefix = f"{ref}: " if ref else ""
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.FAIL,
                reason=f"{prefix}Detected declaration '{detected.value}' does not conform to statutory required format.",
                rule_reference=ref,
                evidence=evidence,
                sub_fields=sub_fields,
            )

        # Field passed verification
        prefix = f"{ref}: " if ref else ""
        reason = f"{prefix}Compliant declaration detected: {detected.value}."
        if detected.notes:
            reason += f" ({detected.notes[0]})"

        return ComplianceCheck(
            field=field_name,
            status=CheckStatus.PASS,
            reason=reason,
            rule_reference=ref,
            evidence=evidence,
            sub_fields=sub_fields,
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
