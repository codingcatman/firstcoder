"""
Minimal implementation of the tariff-impact-analysis skill
(see ../skills/tariff-impact-analysis/SKILL.md).

Real version would parse free-text bulletins with an LLM; this demo reads the
already-structured "structured" field the mock inbox provides, to keep the
focus on the matching/decision logic rather than NLP extraction.
"""


def find_bulletins(messages):
    """Messages that carry a parsed tariff rule."""
    return [m for m in messages if m.get("structured")]


def analyze_impact(bulletin, invoices):
    """Match a bulletin's tariff rule against open invoices and compute deltas."""
    rule = bulletin["structured"]
    affected = []
    for inv in invoices:
        if inv["hs_code"] == rule["hs_code"] and inv["lane"] == rule["lane"]:
            new_duty = round(inv["goods_value_eur"] * rule["new_rate_pct"] / 100, 2)
            affected.append(
                {
                    "invoice": inv,
                    "rule": rule,
                    "old_duty": inv["duty_amount_eur"],
                    "new_duty": new_duty,
                }
            )
    return affected
