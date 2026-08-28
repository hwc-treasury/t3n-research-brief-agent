const key = process.env.T3N_API_KEY;
if (!key) {
  console.error(
    [
      "T3N_API_KEY is not set.",
      "Claim is blocked from this box: the campaign/claim page requires a browser Google/SSO login with a work email.",
      "Do not use a personal account. After a throwaway work-email login, set T3N_API_KEY and re-run.",
      "Claim: https://go.terminal3.io/adk-community",
      "Docs: https://docs.terminal3.io/developers/adk/get-started/prerequisites/request-test-tokens",
    ].join("\n"),
  );
  process.exitCode = 2;
} else {
  console.log("T3N_API_KEY is set (" + key.length + " chars). Run t3n:whoami next.");
}
