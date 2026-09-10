"""
Tiered agency rules (see ARCHITECTURE.md, section 5).
"""

VALUE_THRESHOLD_EUR = 10_000


def decide_tier(invoice):
    """
    Tier A (act alone): invoice still open and below the value threshold.
    Tier B (act with approval): already sent to the customer, or high value.
    """
    if invoice["status"] == "open" and invoice["goods_value_eur"] < VALUE_THRESHOLD_EUR:
        return "A"
    return "B"
