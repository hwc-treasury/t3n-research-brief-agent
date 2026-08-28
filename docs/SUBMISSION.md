# Superteam write-up: Research Brief Agent

Listing: Try out new docs to build a trusted agent with T3N that we can distribute / host
https://superteam.fun/earn/listing/t3n-agent-build-challenge/
Sponsor: Terminal 3 Network. Prize pool 290 USDC. Deadline 16 Sep 2026 11:59 AM ET.
Published 25 Aug 2026 10:27 PM ET. Human-only listing.

## What we built

A boring, hostable enterprise agent: research brief.

Input: a URL, a topic, or a local HTML file.
Output: a one-page brief with problem, facts, risks, next action, sources, and limits.

Local Node CLI proves usefulness tonight. A Rust TEE contract (same shape) is
what T3N would host: fetch happens inside the enclave, the operator sees the
brief, the raw page stays in the TEE, and the brief is stored in a private
tenant map named briefs.

v1 is extractive. No paid model. No memecoin. No spend.

## How to run (local)

From the project root, with Node 18 or newer:

1. Install dependencies with the Node package manager.
2. Run the test script named test in package.json.
3. Run the demo script. It briefs fixtures/sample-vendor.html.
4. Optional: run the brief script with --file, --url, or --topic.

Topic mode calls Wikipedia's public summary API. No key.

## How to run (T3N) after a key exists

1. Put the claimed developer key in the environment variable documented in .env.example.
2. Run the t3n:whoami script. Copy the printed did:t3n value into agent-card.json.
3. In contract/, add the wasm32-wasip2 Rust target, run native cargo tests, then a release wasm build.
4. Run t3n:deploy (registers tail brief-contracts, creates map briefs with contract-only ACL).
5. Run t3n:brief with --url or --topic. The script self-grants egress for that hostname, then invokes draft-brief.

## Would we keep running it or hand it over?

Hand over to Terminal 3 to host and maintain, with an option for us to stay on
as operators later via the startup program / listing page.

Handover is docs/HANDOVER.md plus this repo. One job, one contract, one map.

## Eligibility answers (for the Superteam form)

- Email address: (Jacob fills this)
- DID generated from the page: BLOCKED until SSO claim. Placeholder: did:t3n:REPLACE_AFTER_CLAIM
- Continue running or pass to you: Pass it to Terminal 3 to run. We will stay reachable for questions.

## Blockers (do not skip)

1. T3N DID / API key. go.terminal3.io/adk-community and the claim page require
   a browser Google / work-email SSO login. This box must not use Jacob's
   personal accounts. No key was created. Local agent is fully scaffolded.
2. GitHub publish. gh is not logged in. Project is on disk at /workspace/t3n-agent.
   Do not publish with a personal identity unless that is intended.
3. Superteam submit. Listing agentAccess is HUMAN_ONLY. Submit in the browser
   as a human. Needs public GitHub + public Google Doc + DID + email.
4. Screenshots of bugs. Docs issues are listed in docs/BUGS.md. Capture the
   claim-page "shown once" screen and any SDK error after the key exists.

## Google Doc outline (paste this doc)

Title, repo URL, 60-second pitch, how to run, architecture (CLI vs TEE),
handover choice, bugs, DID (once claimed), contact.
