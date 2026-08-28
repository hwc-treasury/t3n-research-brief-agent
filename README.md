# Research Brief Agent

Enterprise research-brief agent for the Terminal 3 Network ADK challenge.

Paste a URL or topic. Get a one-page brief: problem, facts, risks, next action.

The local demo runs with no T3N credentials. The TEE contract and SDK
scripts are ready and wait on a claimed key.

See docs/SUBMISSION.md for how to run, what is blocked, and the Superteam checklist.
See docs/HANDOVER.md if Terminal 3 takes over hosting.
See docs/BUGS.md for issues found in the current ADK docs.

## Scripts in package.json
test, demo, brief, t3n:whoami, t3n:deploy, t3n:brief


## Local run (no key)

Node 18+. From this directory:

    node --test tests/brief.test.mjs
    node src/cli.mjs --file fixtures/sample-vendor.html
    node src/cli.mjs --url https://docs.terminal3.io/developers/adk/get-started/quickstart
    node src/cli.mjs --topic "SOC 2"
    node src/t3n/check-key.mjs

Sample output: docs/sample-brief.md

## T3N run (needs claimed key + rustup wasm target)

Follow docs/CHECKLIST.md. SDK scripts are in src/t3n/. Contract is in contract/.
WIT host interfaces are vendored from Terminal-3/z-tenant-flight.

## Handover

Prefer T3N to host this after the challenge. See docs/HANDOVER.md.
