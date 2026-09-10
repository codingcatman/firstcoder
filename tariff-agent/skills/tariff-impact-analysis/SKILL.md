---
name: tariff-impact-analysis
description: >
  Use when a tariff/duty-rate change notice (a bulletin, broker email, or customs
  authority notification) needs to be checked against open commercial invoices to
  find which ones reference the old rate and what the corrected duty amount should be.
---

# Tariff Impact Analysis

## When to use this skill

Trigger whenever a new message looks like a tariff or duty-rate change notice —
mentions of an HS code, an import duty percentage, an effective date, and a
trade lane (origin → destination). Do not use it for general customs
correspondence that doesn't state a rate change.

## Steps

1. **Extract the tariff rule** from the source text:
   - HS code(s) affected
   - old rate and new rate (as a percentage)
   - effective date
   - trade lane (origin country → destination country/region)
   If any of these is missing or ambiguous, stop and flag for human review rather
   than guessing.

2. **Match against open invoices**: find invoices whose HS code and lane match the
   rule. An invoice is "affected" only on an exact HS-code + lane match — do not
   match on partial HS-code prefixes unless the bulletin explicitly says the whole
   heading is affected.

3. **Compute the corrected duty amount** for each affected invoice:
   `new_duty = goods_value * new_rate_pct / 100`, and note the delta from the
   current `duty_amount` on file.

4. **Classify confidence** for each affected invoice, to hand off to the tiered
   decision engine:
   - Exactly one applicable rule, unambiguous match → high confidence.
   - Any of: multiple candidate rules, an invoice already sent externally, a
     goods value above the configured threshold → low confidence, route to
     human approval regardless of what the tier engine would otherwise pick.

5. **Return a structured result** per invoice (not prose): invoice id, field to
   change, old value, new value, the tariff rule that justified it, and the
   confidence classification. This is what feeds the decision receipt — never
   apply a change without producing this record first.

## Non-goals

- This skill does not decide *whether* to apply the change autonomously — that's
  the tiered decision engine's job, using the confidence classification this
  skill outputs.
- This skill does not send notifications or emails — that's the Slack/Outlook
  integration layer.
