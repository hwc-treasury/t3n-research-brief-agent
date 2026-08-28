# Building with Terminal 3 ADK (this repo)

Official skill: docs.terminal3.io/developers/adk/support/ai-coding-assistants

Order: claim key, ESM package, authenticated whoami, then contract code.
Do not hard-code a DID. Read it from the session.
Do not reuse T3N_API_KEY as AGENT_KEY.
Plain Node/tsx only (SDK WASM is a known bundler footgun).

This project is a research-brief agent. Local demo does not need a key.
T3N scripts live under src/t3n/. Contract lives under contract/.
