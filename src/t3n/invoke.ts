import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEthAuthInput,
  eth_get_address,
  fetchTrustedManifest,
  getNodeUrl,
  loadWasmComponent,
  metamask_sign,
  setEnvironment,
  T3nClient,
} from "@terminal3/t3n-sdk";
import * as sdk from "@terminal3/t3n-sdk";
import { connectTenant, requiredApiKey, resolveEnv } from "./session.ts";

type DeployRecord = {
  scriptName: string;
  tail: string;
};

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

function lookupVersion(
  nodeUrl: string,
  scriptName: string,
): Promise<string> {
  const s = sdk as Record<string, unknown>;
  const fn =
    (s.getContractVersion as typeof lookupVersion | undefined) ??
    (s.getScriptVersion as typeof lookupVersion | undefined);
  if (!fn) {
    throw new Error("SDK has neither getContractVersion nor getScriptVersion");
  }
  return fn(nodeUrl, scriptName);
}

function arg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  return args.slice(i + 1).join(" ").trim() || undefined;
}

function hostFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const url = arg("--url");
const topic = arg("--topic");
const briefId = arg("--id");
if (!url && !topic && !briefId) {
  console.error("Need --url, --topic, or --id");
  process.exitCode = 2;
} else {
  await run();
}

async function run() {
  const deploy = JSON.parse(
    await readFile(resolve(root, ".t3n-deploy.json"), "utf8"),
  ) as DeployRecord;
  const session = await connectTenant();
  const env = resolveEnv();
  const nodeUrl = getNodeUrl();
  const scriptVersion = await lookupVersion(nodeUrl, deploy.scriptName);

  const hosts = new Set<string>();
  if (url) {
    const host = hostFromUrl(url);
    if (host) hosts.add(host);
  }
  if (topic) {
    hosts.add("en.wikipedia.org");
  }

  const userContractVersion = await lookupVersion(nodeUrl, "tee:user/contracts");
  await session.t3n.execute({
    contract_id: "tee:user/contracts",
    contract_version: userContractVersion,
    function_name: "agent-auth-update",
    input: {
      agents: [
        {
          agentDid: session.tenantDid,
          scripts: [
            {
              scriptName: deploy.scriptName,
              versionReq: scriptVersion,
              functions: ["draft-brief", "get-brief", "list-briefs"],
              allowedHosts: [...hosts],
            },
          ],
        },
      ],
    },
  });

  const agentKey = process.env.AGENT_KEY;
  let caller = session.t3n;
  if (agentKey) {
    setEnvironment(env);
    const wasmComponent = await loadWasmComponent();
    const agentAddress = eth_get_address(agentKey);
    const agentClient = new T3nClient({
      trustAnchor: await fetchTrustedManifest(env === "sandbox" ? "testnet" : env),
      wasmComponent,
      handlers: { EthSign: metamask_sign(agentAddress, undefined, agentKey) },
    });
    await agentClient.handshake();
    await agentClient.authenticate(createEthAuthInput(agentAddress));
    caller = agentClient;
    requiredApiKey();
  }

  const functionName = briefId ? "get-brief" : "draft-brief";
  const input = briefId ? { id: briefId } : url ? { url } : { topic };
  const result = await caller.executeAndDecode({
    contract_id: deploy.scriptName,
    contract_version: scriptVersion,
    function_name: functionName,
    input,
  });
  console.log(JSON.stringify(result, null, 2));
}
