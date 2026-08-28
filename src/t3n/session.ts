import {
  T3nClient,
  TenantClient,
  createEthAuthInput,
  eth_get_address,
  fetchTrustedManifest,
  getNodeUrl,
  loadWasmComponent,
  metamask_sign,
  setEnvironment,
} from "@terminal3/t3n-sdk";

export type T3nEnvName = "testnet" | "sandbox" | "production";

export type ConnectedSession = {
  t3n: T3nClient;
  tenant: TenantClient;
  tenantDid: string;
  address: string;
  env: T3nEnvName;
};

export function requiredApiKey(): string {
  const key = process.env.T3N_API_KEY;
  if (!key) {
    throw new Error(
      [
        "T3N_API_KEY is not set.",
        "Claim is blocked from this box: the campaign/claim page requires a browser Google/SSO login with a work email.",
        "Do not use a personal account. After a throwaway work-email login, export T3N_API_KEY and re-run.",
        "Claim: https://go.terminal3.io/adk-community",
        "Docs: https://docs.terminal3.io/developers/adk/get-started/prerequisites/request-test-tokens",
      ].join("\n"),
    );
  }
  return key;
}

export function resolveEnv(): T3nEnvName {
  const raw = (process.env.T3N_ENV ?? "testnet").toLowerCase();
  if (raw === "production") return "production";
  if (raw === "sandbox") return "sandbox";
  return "testnet";
}

export async function connectTenant(): Promise<ConnectedSession> {
  const apiKey = requiredApiKey();
  const env = resolveEnv();
  setEnvironment(env);

  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(apiKey);
  const t3n = new T3nClient({
    trustAnchor: await fetchTrustedManifest(env === "sandbox" ? "testnet" : env),
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, apiKey),
    },
  });

  await t3n.handshake();
  const did = await t3n.authenticate(createEthAuthInput(address));
  const tenantDid = did.value;

  const tenant = new TenantClient({
    t3n,
    baseUrl: getNodeUrl(),
    tenantDid,
  });
  await tenant.tenant.me();

  return { t3n, tenant, tenantDid, address, env };
}
