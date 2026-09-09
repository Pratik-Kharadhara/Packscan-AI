"""Configurable, explainable first-level package screening decisions."""

from __future__ import annotations

import re
from enum import StrEnum
from typing import Any

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
    detected_value: str | None = None
    confidence: float | None = None
    evidence: str | None = None
    bounding_boxes: list[Any] = Field(default_factory=list)
    applicable_rule: str | None = None
    rule_reference: str | None = None
    rule_id: str | None = None
    legal_name: str | None = None
    validation_result: str | None = None
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
                    validation_result="LOW_IMAGE_QUALITY",
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
                        applicable_rule=ref,
                        rule_reference=ref,
                        validation_result="NOT_APPLICABLE",
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
        rule_id = getattr(rule, "rule_id", None)
        legal_name = getattr(rule, "legal_name", None)
        confidence = detected.confidence if detected else None
        sub_fields = detected.sub_fields if detected else {}
        evidence = detected.matched_text or detected.raw_text if detected else None
        bounding_boxes = detected.bounding_boxes if detected else []
        detected_value = detected.value if (detected and detected.found) else None

        if not image_usable:
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.REVIEW,
                reason="Image quality is insufficient for a reliable automated field conclusion.",
                detected_value=detected_value,
                applicable_rule=ref,
                rule_reference=ref,
                rule_id=rule_id,
                legal_name=legal_name,
                confidence=confidence,
                evidence=evidence,
                bounding_boxes=bounding_boxes,
                validation_result="LOW_IMAGE_QUALITY",
                sub_fields=sub_fields,
            )

        if detected is None or not detected.found:
            status = CheckStatus(getattr(rule, "missing_status"))
            prefix = f"{ref}: " if ref else ""
            return ComplianceCheck(
                field=field_name,
                status=status,
                reason=(
                    f"{prefix}Declaration not visible or insufficient OCR evidence on photographed package surface. Manual verification recommended."
                    if status is CheckStatus.REVIEW
                    else f"{prefix}Required declaration determined to be absent from scanned panel."
                ),
                detected_value=None,
                applicable_rule=ref,
                rule_reference=ref,
                rule_id=rule_id,
                legal_name=legal_name,
                confidence=None,
                evidence=None,
                bounding_boxes=[],
                validation_result="INSUFFICIENT_EVIDENCE",
                sub_fields=sub_fields,
            )

        # Handle semantic date separation: only expiry date detected when mfg/pkg date is required (Rule 6(1)(d))
        if field_name == "manufacture_date":
            if sub_fields.get("date_type") == "expiry_only":
                return ComplianceCheck(
                    field=field_name,
                    status=CheckStatus.REVIEW,
                    reason=f"{ref or 'Rule 6(1)(d)'}: Expiry date detected ({detected.value}), but mandatory month & year of manufacture/pre-packing is missing.",
                    detected_value=detected_value,
                    applicable_rule=ref,
                    rule_reference=ref,
                    rule_id=rule_id,
                    legal_name=legal_name,
                    confidence=confidence,
                    evidence=evidence,
                    bounding_boxes=bounding_boxes,
                    validation_result="EXPIRY_ONLY",
                    sub_fields=sub_fields,
                )
            elif sub_fields.get("date_type") == "packaging_date":
                if detected.confidence is None or detected.confidence < getattr(rule, "minimum_confidence"):
                    prefix = f"{ref}: " if ref else ""
                    return ComplianceCheck(
                        field=field_name,
                        status=CheckStatus.REVIEW,
                        reason=(
                            f"{prefix}Packaging date declaration detected with confidence {detected.confidence or 0:.2f}, below "
                            f"configured threshold of {getattr(rule, 'minimum_confidence'):.2f}."
                        ),
                        detected_value=detected_value,
                        applicable_rule=ref,
                        rule_reference=ref,
                        rule_id=rule_id,
                        legal_name=legal_name,
                        confidence=confidence,
                        evidence=evidence,
                        bounding_boxes=bounding_boxes,
                        validation_result="LOW_CONFIDENCE",
                        sub_fields=sub_fields,
                    )
                prefix = f"{ref}: " if ref else ""
                reason = f"{prefix}Compliant pre-packing/packaging date declaration detected: {detected.value}."
                if sub_fields.get("use_by_date"):
                    reason += f" (Use By: {sub_fields['use_by_date']})"
                elif sub_fields.get("expiry_date"):
                    reason += f" (Expiry: {sub_fields['expiry_date']})"
                return ComplianceCheck(
                    field=field_name,
                    status=CheckStatus.PASS,
                    reason=reason,
                    detected_value=detected_value,
                    applicable_rule=ref,
                    rule_reference=ref,
                    rule_id=rule_id,
                    legal_name=legal_name,
                    confidence=confidence,
                    evidence=evidence,
                    bounding_boxes=bounding_boxes,
                    validation_result="VALID",
                    sub_fields=sub_fields,
                )

        # Handle consumer care compliance under Legal Metrology Rule 6(2)
        if field_name == "consumer_contact":
            has_context = sub_fields.get("has_context", True)
            has_contact = bool(
                sub_fields.get("toll_free")
                or sub_fields.get("phone")
                or sub_fields.get("email")
                or (detected.value and re.search(r"\b1800[- ]?\d{3,4}[- ]?\d{3,4}\b|(?:\+91[- ]?)?[6-9]\d{9}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", detected.value))
            )

            if not has_contact or not has_context:
                prefix = f"{ref}: " if ref else ""
                return ComplianceCheck(
                    field=field_name,
                    status=CheckStatus.REVIEW,
                    reason=(
                        f"{prefix}Declaration not visible or insufficient OCR evidence on photographed package surface. Manual verification recommended."
                    ),
                    detected_value=detected_value,
                    applicable_rule=ref,
                    rule_reference=ref,
                    rule_id=rule_id,
                    legal_name=legal_name,
                    confidence=confidence,
                    evidence=evidence,
                    bounding_boxes=bounding_boxes,
                    validation_result="INSUFFICIENT_EVIDENCE",
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
                    detected_value=detected_value,
                    applicable_rule=ref,
                    rule_reference=ref,
                    rule_id=rule_id,
                    legal_name=legal_name,
                    confidence=confidence,
                    evidence=evidence,
                    bounding_boxes=bounding_boxes,
                    validation_result="LOW_CONFIDENCE",
                    sub_fields=sub_fields,
                )

            prefix = f"{ref}: " if ref else ""
            desc_parts = [f"Compliant consumer care details detected: {detected.value}."]
            if sub_fields.get("office"):
                desc_parts.append(f"Person/Office: {sub_fields['office']}.")
            if sub_fields.get("company"):
                desc_parts.append(f"Entity: {sub_fields['company']}.")
            if sub_fields.get("address"):
                desc_parts.append("Address verified.")
            reason = f"{prefix}{' '.join(desc_parts)}"

            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.PASS,
                reason=reason,
                detected_value=detected_value,
                applicable_rule=ref,
                rule_reference=ref,
                rule_id=rule_id,
                legal_name=legal_name,
                confidence=confidence,
                evidence=evidence,
                bounding_boxes=bounding_boxes,
                validation_result="VALID",
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
                detected_value=detected_value,
                applicable_rule=ref,
                rule_reference=ref,
                rule_id=rule_id,
                legal_name=legal_name,
                confidence=confidence,
                evidence=evidence,
                bounding_boxes=bounding_boxes,
                validation_result="LOW_CONFIDENCE",
                sub_fields=sub_fields,
            )

        if not detected.value or not re.fullmatch(getattr(rule, "value_pattern"), detected.value, re.IGNORECASE | re.DOTALL):
            prefix = f"{ref}: " if ref else ""
            return ComplianceCheck(
                field=field_name,
                status=CheckStatus.FAIL,
                reason=f"{prefix}Detected declaration '{detected.value}' does not conform to statutory required format.",
                detected_value=detected_value,
                applicable_rule=ref,
                rule_reference=ref,
                rule_id=rule_id,
                legal_name=legal_name,
                confidence=confidence,
                evidence=evidence,
                bounding_boxes=bounding_boxes,
                validation_result="INVALID_FORMAT",
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
            detected_value=detected_value,
            applicable_rule=ref,
            rule_reference=ref,
            rule_id=rule_id,
            legal_name=legal_name,
            confidence=confidence,
            evidence=evidence,
            bounding_boxes=bounding_boxes,
            validation_result="VALID",
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
            return "Screening result: NON_COMPLIANT based on detected declarations and configured rules. Review the evidence before taking action."
        if CheckStatus.REVIEW in statuses:
            return "Screening result: NEEDS_REVIEW. Manual verification is recommended because one or more declarations are unclear, unphotographed, or below confidence thresholds."
        return "Screening result: COMPLIANT based on detected declarations and configured rules."
