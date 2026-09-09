import sys
sys.path.insert(0, ".")
import re
from src.detection.content_validator import is_plausible_commodity, is_plausible_mrp_amount

print("Test is_plausible_commodity:")
test_commodities = [
    ("361.79 Kcal", False),
    ("Energy", False),
    ("Total Fat", False),
    ("17.67 gm", False),
    ("Protein", False),
    ("9.43 gm", False),
    ("Carbohydrate", False),
    ("31.07 gm", False),
    ("Calcium", False),
    ("22.08 mg", False),
    ("Iron", False),
    ("24.90 mg", False),
    ("Vitamin A", False),
    ("389 mcg", False),
    ("Vitamin B1", False),
    ("0.88 mg", False),
    ("SPICES", True),
    ("Salt", True),
    ("Edible Common Salt", True),
    ("Tea", True),
    ("Turmeric Powder", True),
]

all_pass = True
for text, expected in test_commodities:
    result = is_plausible_commodity(text)
    if result != expected:
        print(f"FAIL: {repr(text)} -> {result} (expected {expected})")
        all_pass = False
    else:
        print(f"PASS: {repr(text)} -> {result}")

print("Commodity tests all pass:", all_pass)
