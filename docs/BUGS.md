# Docs and product issues (for the listing)

The listing scores bug-report quality. These were found while following the
refreshed ADK docs on 26 Aug 2026. None were invented.

## Claim / identity

1. Three different claim URLs: go.terminal3.io/adk-community (listing),
   docs "claim page" which points at www.terminal3.io/claim-page, and
   docs.terminal3.io/developers/adk/get-started/prerequisites/request-test-tokens.
   An agent hitting the campaign short link gets a timeout or an SSO wall.
2. Docs say "sign in with your work email". The product claim page says
   "Sign in with Google". Those are not the same instruction.
3. Key is shown once and cannot be retrieved. That is documented, but there
   is no "I lost my key" path besides emailing devrel@terminal3.io.
4. Quickstart never says the "API key" is an Ethereum secp256k1 private key
   until you see eth_get_address / Invalid Ethereum private key. Easy to
   paste a random token and fail.

## SDK and walkthrough mismatches

5. Invoke walkthrough imports getContractVersion. The reference table lists
   getScriptVersion. SDK 5.2.0 may export one, the other, or both.
   This repo's invoke script accepts either.
6. Quickstart uses setEnvironment("testnet"). Org-agent docs say sandbox and
   testnet are the same cluster, and CLI flags accept sandbox|testnet|production.
   The TypeScript sample does not mention sandbox.
7. Write-contract page says clone z-tenant-flight as a sibling of the Node
   app. Easy to nest it inside the Node app and then hit ENOENT on WASM_PATH.
   Called out in the pitfalls table, still the default footgun.
8. world.wit in GitHub README-quality pages vs docs: GitHub raw rendering
   sometimes drops the u8 in list of bytes, so copy-paste from HTML can
   produce invalid WIT (result of list, string).
9. KV readers must be set or the contract cannot read its own map
   (AccessDenied). Default deny is correct; the flight sample in older
   memory of the docs omitted readers. Current create-kv-maps page is clear.
   Still easy to miss if you copy only register-contract.
10. Re-registering a tail allocates a new contract_id and can orphan map
    ACLs. Documented, but there is no API to look up the current id by tail.

## Bundler / runtime

11. WASM component loading is a known rough edge under Next, Vite, and older
    Webpack. Quickstart says so. Plain Node/tsx is the only path this repo uses.
12. package.json must set type module or top-level await in quickstart.ts
    fails with a CJS error. Easy first-timer bug.

## Listing / Earn

13. Superteam listing page is JS-rendered; WebFetch of the HTML does not
    include the scope. Details are at
    earn.superteam.fun/api/listings/details/t3n-agent-build-challenge
14. Listing is HUMAN_ONLY even though it is an agent-building bounty.
    Agent Earn submit will not work.
15. Submission asks for a public Google Doc containing the GitHub repo,
    screenshots, and bugs. The form also asks for DID from "the page" —
    meaning the claim page, not the Google Doc.

## Not bugs, just constraints we hit

16. Confirmed 28 Aug 2026: go.terminal3.io/adk-community silently redirects
    to terminal3.io/products/agent-developer-kit. There is no /adk-community page.
17. Confirmed 28 Aug 2026: the claim card labels a field "Email address" but
    it is only a "Login with Google" button. No GitHub OAuth, no typed email,
    no magic link. Google rejects non-Gmail agent mailboxes
    (hwc.treasury@agentmail.to -> Could not find this account).
18. Campaign code field is optional (placeholder SUPERAI2026). Claim stays
    disabled until Google SSO completes.

## Not bugs, just constraints we hit

- Public GitHub exists: https://github.com/hwc-treasury/t3n-research-brief-agent
- DID still blocked on Google-only SSO for a non-Google agent mailbox.

19. Confirmed 28 Aug 2026: @terminal3/t3n-sdk 5.3.0 fails whoami with "Trust manifest ... is malformed" because it requires rtmr1_allowlist; live testnet manifest only has peer_ids + rtmr3_allowlist. 5.2.0 works. Pin 5.2.0.
