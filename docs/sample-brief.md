# Research brief: Northwind Payments — vendor diligence memo

Source: file · fixtures/sample-vendor.html
Fetched: 2026-08-27T02:37:06.324Z
Id: c8c77cfdc9690a83

## Problem
The problem is that Northwind is the only processor for invoice payouts, so a repeat of last quarter's 14-hour outage would freeze AP for every EU entity.

## Facts
1. They report 99.95% uptime in 2026, 4,200 enterprise customers, and a published 4-hour SLA credit.
2. SOC 2 Type II is current through March 2027.
3. Security review flagged that webhook signing secrets are rotated annually, which is a privacy and breach-exposure risk if an endpoint is compromised.
4. Legal and compliance should review the subprocessors list before we expand to payroll.

## Risks
- Security review flagged that webhook signing secrets are rotated annually, which is a privacy and breach-exposure risk if an endpoint is compromised.
- Legal and compliance should review the subprocessors list before we expand to payroll.
- Cost is $0.32 per payout plus a $12k annual platform fee; vendor lock-in is real because settlement files are proprietary.

## Next action
Recommended next step: assign finance ops to run a tabletop of a 24-hour outage this week, then decide go / no-go on dual-homing 20% of volume to a backup processor.

## Sources
- Northwind Payments — vendor diligence memo

## Limits
v1 is extractive (no LLM). It quotes and classifies sentences from the source. It does not browse beyond the given URL/topic, and it does not treat the brief as legal, security, or investment advice.
