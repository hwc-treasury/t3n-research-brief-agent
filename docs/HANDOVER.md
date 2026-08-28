# Handover to Terminal 3

Preference: T3N hosts and maintains this agent after the challenge.
We can stay on as operators later via the startup program if useful.

## What you are taking

- One Node CLI (src/) for operators and CI.
- One TEE contract (contract/) with three functions: draft-brief, get-brief, list-briefs.
- One private map tail: briefs.
- One contract tail: brief-contracts.
- agent-card.json (fill DID after whoami, then t3n agent host-card).

No third-party paid APIs. Wikipedia is optional and only for topic mode.

## Operate

1. Claim a tenant key on testnet. Keep it off git.
2. Build the wasm component from contract/.
3. Register with the deploy script. Record contract_id (re-register allocates a new id).
4. Grant egress per hostname at invoke time (already in the invoke script).
5. Optional: mint an org-owned agent so the operator key and the agent key are split.
   Never reuse the tenant key as AGENT_KEY.

## Do not

- Put PII in a public map.
- Add an LLM until there is a secrets map and a budget owner.
- Lengthen the contract tail.

## Support

Listing POC: Telegram t.me/wardumb (Ian Chong).
Devrel: devrel@terminal3.io
Developer Telegram: t.me/terminal3developer
