# Jacob: submit tonight

Listing is HUMAN_ONLY. Submit in the browser, not via the Earn agent API.
Earlier submissions score higher. 12 submissions already when this was built.
Deadline: 16 Sep 2026 11:59 AM ET. Winners by 23 Sep 2026.

Form: https://superteam.fun/earn/listing/t3n-agent-build-challenge/

## Still blocked (do these first)

1. T3N DID + API key
   - Open https://go.terminal3.io/adk-community in a browser.
   - Sign in with a work email / Google SSO. Do not use a personal account.
   - Copy the key immediately (shown once). It is a 0x secp256k1 private key.
   - Save DID from the page for the Superteam form.
   - Exact blocker from this box: SSO / browser login required. No key was created.

2. Public GitHub repo
   - gh is not logged in on this machine.
   - Project is at /workspace/t3n-agent.
   - Create a public repo from a throwaway or intended identity, push, paste URL.

3. Public Google Doc
   - Paste docs/SUBMISSION.md + docs/BUGS.md + docs/sample-brief.md + screenshots.
   - Anyone-with-link viewer.

4. Screenshots
   - Local demo terminal (node src/cli.mjs --file fixtures/sample-vendor.html).
   - Claim page / DID once you have it.
   - Any SDK error after the key exists. Bugs already listed in docs/BUGS.md.

## After the key exists (on this project)

1. Set T3N_API_KEY and T3N_ENV=testnet.
2. Install Node deps (tsx + @terminal3/t3n-sdk).
3. node src/t3n/check-key.mjs then the t3n:whoami script.
4. Put did:t3n into agent-card.json.
5. rustup target add wasm32-wasip2 (rustup is missing on this box; rustc/cargo exist).
6. cargo test in contract/ (already passing natively).
7. cargo build --target wasm32-wasip2 --release
8. t3n:deploy then t3n:brief with a URL.

## Superteam form fields

- Email address: yours
- What is your DID generated from the page?: did:t3n:... from claim page
- Continue running or pass it to us?: Pass it to Terminal 3 to run (see docs/HANDOVER.md)
- Link: public GitHub URL
- Tweet: not required (bonus only: tag @terminal3io)
- otherInfo / Google Doc: public doc URL

No X required. No spend. No memecoin.
POC if credits needed: https://t.me/wardumb with DID, quote Superteam.
