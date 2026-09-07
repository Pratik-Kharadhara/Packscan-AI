"""Load and validate configurable screening rules."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


DEFAULT_RULES_PATH = Path(__file__).resolve().parents[2] / "rules" / "compliance_rules.json"


class FieldRule(BaseModel):
    """One field's configurable screening requirements."""

    required: bool
    minimum_confidence: float = Field(ge=0.0, le=1.0)
    value_pattern: str
    missing_status: Literal["REVIEW", "FAIL"] = "REVIEW"
    rule_reference: str | None = None
    legal_name: str | None = None


class ComplianceRules(BaseModel):
    """Versioned screening-rule profile loaded from JSON."""

    version: str
    profile_name: str
    note: str
    fields: dict[str, FieldRule]


class RuleLoader:
    """Load a single external rule profile without embedding rules in Python modules."""

    def __init__(self, rules_path: Path = DEFAULT_RULES_PATH) -> None:
        self._rules_path = rules_path

    def load(self) -> ComplianceRules:
        """Read and validate the configured screening profile."""

        with self._rules_path.open(encoding="utf-8") as file:
            return ComplianceRules.model_validate(json.load(file))
