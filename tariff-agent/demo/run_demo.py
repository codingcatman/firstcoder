"""
Tariff Watch demo — see ../ARCHITECTURE.md.

Run with: python3 run_demo.py   (from inside tariff-agent/demo)
       or: python3 demo/run_demo.py   (from tariff-agent/)
"""

import datetime
import json
from pathlib import Path

from integrations import outlook_mcp, slack_mcp
from tariff_impact_analysis import analyze_impact, find_bulletins
from decision_engine import decide_tier

BASE = Path(__file__).resolve().parent
INVOICES_PATH = BASE / "mock_data" / "invoices.json"
LOG_PATH = BASE / "decision_log.jsonl"


def load_invoices():
    with open(INVOICES_PATH, encoding="utf-8") as f:
        return json.load(f)


def log_receipt(receipt):
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(receipt) + "\n")


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def main():
    print("=== Tariff Watch demo ===\n")

    invoices = load_invoices()
    if LOG_PATH.exists():
        LOG_PATH.unlink()

    print("1. Checking Outlook inbox for tariff bulletins...")
    unread = outlook_mcp.read_inbox()
    bulletins = find_bulletins(unread)
    if not bulletins:
        print("   No tariff bulletins found.")
        return

    receipt_n = 1
    for bulletin in bulletins:
        rule = bulletin["structured"]
        print(f"\n2. Bulletin found: {bulletin['subject']}")
        print(
            f"   Parsed rule: HS {rule['hs_code']}, lane {rule['lane']}, "
            f"{rule['old_rate_pct']}% -> {rule['new_rate_pct']}%, "
            f"effective {rule['effective_date']}"
        )

        impacts = analyze_impact(bulletin, invoices)
        if not impacts:
            print("   No open invoices match this rule.")
            continue

        print(f"\n3. Impact analysis: {len(impacts)} invoice(s) affected")
        for impact in impacts:
            inv = impact["invoice"]
            tier = decide_tier(inv)
            print(
                f"\n   -> {inv['invoice_id']} ({inv['customer']}): "
                f"duty {impact['old_duty']} EUR -> {impact['new_duty']} EUR "
                f"[status={inv['status']}, value={inv['goods_value_eur']} EUR] "
                f"=> Tier {tier}"
            )

            approver = None
            proceed = True
            if tier == "B":
                proceed = slack_mcp.request_approval(
                    f"Tariff change on HS {rule['hs_code']} ({rule['lane']}) affects "
                    f"{inv['invoice_id']} ({inv['customer']}), already sent to "
                    f"customer, value {inv['goods_value_eur']} EUR. Proposed duty: "
                    f"{impact['old_duty']} -> {impact['new_duty']} EUR. Approve?"
                )
                approver = "ops-team (simulated)"

            receipt = {
                "receipt_id": f"DR-2026-{receipt_n:04d}",
                "timestamp": now_iso(),
                "trigger_email_id": bulletin["id"],
                "tariff_rule": rule,
                "invoice_id": inv["invoice_id"],
                "field_changed": "duty_amount_eur",
                "old_value": impact["old_duty"],
                "new_value": impact["new_duty"] if proceed else impact["old_duty"],
                "tier": tier,
                "approver": approver,
                "action": "corrected" if proceed else "rejected",
            }
            log_receipt(receipt)
            receipt_n += 1

            if not proceed:
                print(f"   Rejected — no change applied to {inv['invoice_id']}.")
                continue

            inv["duty_amount_eur"] = impact["new_duty"]
            inv["duty_rate_pct"] = rule["new_rate_pct"]

            if tier == "A":
                slack_mcp.post_message(
                    f"Auto-corrected {inv['invoice_id']} ({inv['customer']}) for the "
                    f"HS {rule['hs_code']} tariff change: duty "
                    f"{impact['old_duty']} -> {impact['new_duty']} EUR."
                )
            else:
                slack_mcp.post_message(
                    f"Correction to {inv['invoice_id']} approved and applied."
                )

            if inv["status"] == "sent_to_customer":
                outlook_mcp.send_email(
                    to=inv["customer"],
                    subject=f"Corrected commercial invoice {inv['invoice_id']}",
                    body=(
                        f"Following a tariff update on HS {rule['hs_code']} "
                        f"(effective {rule['effective_date']}), please find the "
                        f"corrected duty amount: {impact['new_duty']} EUR "
                        f"(previously {impact['old_duty']} EUR)."
                    ),
                )

    print(f"\n4. Done. Decision log written to {LOG_PATH.relative_to(BASE.parent)}")


if __name__ == "__main__":
    main()
