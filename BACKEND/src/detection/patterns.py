"""Loading and compilation helpers for external declaration-detection patterns."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


DEFAULT_PATTERNS_PATH = Path(__file__).resolve().parents[2] / "rules" / "detection_patterns.json"


def load_detection_patterns(path: Path = DEFAULT_PATTERNS_PATH) -> dict[str, dict[str, Any]]:
    """Load the externally maintained pattern registry."""

    with path.open(encoding="utf-8") as file:
        payload = json.load(file)
    return payload["fields"]


def compile_any(expressions: list[str]) -> re.Pattern[str]:
    """Compile context expressions as one case-insensitive matcher."""

    return re.compile("|".join(f"(?:{expression})" for expression in expressions), re.IGNORECASE)
