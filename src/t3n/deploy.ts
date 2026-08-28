import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectTenant } from "./session.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const WASM_PATH = resolve(
  root,
  "contract/target/wasm32-wasip2/release/z_research_brief.wasm",
);
const CONTRACT_TAIL = "brief-contracts";
const CONTRACT_VERSION = process.env.CONTRACT_VERSION ?? "0.1.0";

const session = await connectTenant();
const wasm = await readFile(WASM_PATH).catch(() => {
  throw new Error(
    "WASM not built. From contract/: rustup target add wasm32-wasip2 && cargo build --target wasm32-wasip2 --release",
  );
});

const result = await session.tenant.contracts.register({
  tail: CONTRACT_TAIL,
  version: CONTRACT_VERSION,
  wasm,
});

const contractId = result.contract_id;
const tenantId = session.tenantDid.slice("did:t3n:".length);
const scriptName = "z:" + tenantId + ":" + CONTRACT_TAIL;

await session.tenant.maps.create({
  tail: "briefs",
  visibility: "private",
  writers: { only: [contractId] },
  readers: { only: [contractId] },
});

const record = {
  tenantDid: session.tenantDid,
  contractId,
  scriptName,
  tail: CONTRACT_TAIL,
  version: CONTRACT_VERSION,
  registeredAt: new Date().toISOString(),
};
await writeFile(resolve(root, ".t3n-deploy.json"), JSON.stringify(record, null, 2));

console.log("registered " + scriptName + " as contract id " + contractId);
console.log("created private map z:<tid>:briefs with contract-only ACL");
console.log("wrote .t3n-deploy.json (gitignored if you add it; contains no secrets)");
