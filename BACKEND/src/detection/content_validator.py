"""Reusable field-content plausibility validation layer for PACKSCAN AI.

Validates semantic plausibility of OCR text candidates for each declaration type
to prevent misclassifications (e.g., nutrition values classified as commodity).
"""

from __future__ import annotations

import re


# Nutrition and dietary terms that must NEVER be classified as commodity identity or net quantity
NUTRITION_TERMS = re.compile(
    r"\b(?:"
    r"nutritional?\s*(?:information|facts?|values?)|"
    r"energy|calories|kcal|cal|kj|"
    r"total\s+fat|saturated\s+fat|trans\s+fat|fatty\s+acids?|cholesterol|"
    r"carbohydrates?|dietary\s+fiber|fiber|sugars?|added\s+sugars?|"
    r"protein|sodium|potassium|calcium|iron|phosphorus|zinc|"
    r"vitamins?\s*[a-z0-9]*|"
    r"serving\s*size|per\s*serve|per\s*100\s*g|per\s*pack|"
    r"approx\s*values?|approximate|fat"
    r")\b",
    re.IGNORECASE,
)

# Numeric value with measurement unit (e.g., 361.79 Kcal, 17.67 gm, 24.90 mg, 15 %)
NUMERIC_WITH_UNIT = re.compile(
    r"(?:^|\s)~?\s*\d+(?:[.,]\d+)?\s*(?:kcal|cal|kj|g|gm|gms|kg|mg|mcg|ml|l|litre|%|percent)\b",
    re.IGNORECASE,
)

# Explicit lot, batch, serial, or barcode prefixes
LOT_SERIAL_PREFIXES = re.compile(
    r"\b(?:"
    r"lot(?:\s*no\.?|\s*number)?|"
    r"batch(?:\s*no\.?|\s*number)?|"
    r"b\.?\s*no\.?|"
    r"serial(?:\s*no\.?|\s*number)?|"
    r"s\.?\s*no\.?|"
    r"l\.?\s*no\.?|"
    r"l\.hol|"
    r"bn|"
    r"barcode|"
    r"lic(?:\.|\s*no\.?)?|"
    r"fssai"
    r")\b",
    re.IGNORECASE,
)

# Packaging instructions and administrative headers
PACKAGING_INSTRUCTIONS = re.compile(
    r"\b(?:"
    r"keep\s+in|store\s+in|cool\s+and\s+dry|directions?|warning|caution|"
    r"ingredients?|batch|lot|b\.?\s*no|lic|fssai|barcode|"
    r"mfg|mfd|pkd|exp|best\s+before|use\s+by|use\s+before|"
    r"mrp|rs|inr|net\s+wt|net\s+qty|net\s+quantity|"
    r"consumer\s+care|customer\s+care|toll\s+free|helpline|email"
    r")\b",
    re.IGNORECASE,
)


def is_nutrition_value(text: str) -> bool:
    """Validate whether an OCR text represents a nutrition table entry or nutrition value.
    
    Examples: '361.79 Kcal', 'Total Fat 17.67 gm', 'Protein 8.5g', 'Energy 361.79', '17.67 gm'.
    """
    if not text:
        return False
    text_clean = text.strip()
    text_lower = text_clean.lower()

    # Contains explicit nutrition units (kcal, cal, kj)
    if re.search(r"\b(?:kcal|cal|kj)\b", text_lower):
        return True

    # Contains nutrient name + numeric value
    if NUTRITION_TERMS.search(text_lower) and re.search(r"\d", text_clean):
        return True

    # Pure nutrient name
    if NUTRITION_TERMS.search(text_lower) and len(text_lower.split()) <= 3:
        return True

    return False


def is_lot_or_serial_number(text: str) -> bool:
    """Validate whether text represents a manufacturing lot, batch, serial number, or barcode.
    
    Examples: 'Lot No: L/G/26', 'Serial No: 12345', 'Batch No: 501', 'BN: DA'.
    """
    if not text:
        return False
    text_clean = text.strip()
    return bool(LOT_SERIAL_PREFIXES.search(text_clean))


def is_plausible_commodity(text: str) -> bool:
    """Validate whether an OCR string is plausible as a commodity or product name.
    
    Rejects strings that are mostly numeric, numeric with units (nutrition values),
    nutrition table headers, lot/serial indicators, or packaging instructions.
    """
    if not text:
        return False

    text_clean = text.strip()
    text_lower = text_clean.lower()

    # 1. Reject if nutrition term or nutrition value (e.g. "361.79 Kcal", "Total Fat 17.67 gm")
    if is_nutrition_value(text_clean):
        return False

    # 2. Reject if numeric + unit (e.g. "361.79 Kcal", "17.67 gm", "24.90 mg")
    if NUMERIC_WITH_UNIT.search(text_lower):
        return False

    # 3. Reject if lot, batch, or serial number
    if is_lot_or_serial_number(text_clean):
        return False

    # 4. Reject if mostly digits (must have more alphabetic characters than digits)
    alpha_chars = len(re.findall(r"[a-zA-Z]", text_clean))
    digit_chars = len(re.findall(r"\d", text_clean))
    if alpha_chars < 3 or digit_chars >= alpha_chars:
        return False

    # 5. Reject packaging instructions, dates, licensing, contact info
    if PACKAGING_INSTRUCTIONS.search(text_lower):
        return False

    # 6. Must contain at least one valid word with 3+ alphabetic characters
    if not re.search(r"\b[a-zA-Z]{3,}\b", text_clean):
        return False

    return True


def is_plausible_mrp_amount(amount_str: str) -> bool:
    """Validate whether a parsed numeric string is plausible as an Indian Retail Price (MRP)."""
    try:
        val = float(amount_str.replace(",", "."))
    except (ValueError, TypeError):
        return False

    # Plausible Indian retail prices: between ₹ 0.50 and ₹ 99,999.00
    if not (0.50 <= val <= 99999.0):
        return False

    # Exclude 4-digit calendar years (e.g. 2024, 2026) when written as bare integers
    if val.is_integer() and (2020 <= int(val) <= 2035):
        return False

    # Exclude PIN codes (6-digit integers)
    if val.is_integer() and (100000 <= int(val) <= 999999):
        return False

    return True


def is_plausible_net_quantity(val_str: str, unit_str: str, surrounding_text: str = "") -> bool:
    """Validate whether a quantity number and unit are plausible under Legal Metrology.
    
    Rejects nutrition values (e.g. 17.67 gm fat) or quantities associated with lot numbers.
    """
    try:
        val = float(val_str.replace(",", "."))
    except (ValueError, TypeError):
        return False

    if val <= 0:
        return False

    # Standard Legal Metrology units
    valid_units = {"mg", "g", "gm", "gms", "kg", "ml", "l", "litre", "litres", "pcs", "piece", "pieces", "units", "unit", "n", "u"}
    if unit_str.lower() not in valid_units:
        return False

    # Upper limits for consumer packaged commodities (e.g. max 50000 kg / l)
    if val > 50000:
        return False

    # Reject if surrounding text indicates a nutrient (e.g., "Total Fat 17.67 gm", "Protein 8.5 g")
    if surrounding_text:
        if is_nutrition_value(surrounding_text) or NUTRITION_TERMS.search(surrounding_text):
            return False
        if is_lot_or_serial_number(surrounding_text):
            return False

    return True


def is_plausible_date(date_str: str) -> bool:
    """Validate whether an extracted date string represents a plausible manufacturing/packaging date."""
    if not date_str or len(date_str.strip()) < 4:
        return False

    # Exclude obvious non-dates
    if re.search(r"\b(?:rs|mrp|fssai|lic|batch|lot|kcal)\b", date_str, re.IGNORECASE):
        return False

    # Must contain digit and either slash, hyphen, or month name
    has_digit = bool(re.search(r"\d", date_str))
    has_separator_or_month = bool(
        re.search(
            r"[/.-]|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b",
            date_str,
            re.IGNORECASE,
        )
    )
    return has_digit and has_separator_or_month


def is_plausible_phone(phone_str: str) -> bool:
    """Validate Indian consumer phone/toll-free format."""
    cleaned = re.sub(r"[\s\-+]", "", phone_str)
    # Toll-free: 1800 followed by 6-7 digits
    if cleaned.startswith("1800") and (10 <= len(cleaned) <= 11):
        return True
    # Indian mobile: 10 digits starting with 6, 7, 8, 9 (with or without 91 prefix)
    if cleaned.startswith("91") and len(cleaned) == 12 and cleaned[2] in "6789":
        return True
    if len(cleaned) == 10 and cleaned[0] in "6789":
        return True
    return False


def is_plausible_email(email_str: str) -> bool:
    """Validate email address format."""
    email_regex = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    return bool(email_regex.match(email_str.strip()))


def is_plausible_manufacturer(text: str) -> bool:
    """Validate whether an extracted text candidate is plausible as a manufacturer/packer/marketer name."""
    if not text or len(text.strip()) < 3:
        return False
    # Reject nutrition or pure numbers
    if is_plausible_commodity(text) is False and not re.search(r"\b(?:ltd|limited|pvt|private|works|foods|industries|corp|enterprises|mfg|mkt|packed)\b", text, re.IGNORECASE):
        return False
    return True

