import { connectTenant } from "./session.ts";

const session = await connectTenant();
console.log("Connected as:", session.tenantDid);
console.log("Address:", session.address);
console.log("Env:", session.env);
console.log("TenantClient ready.");
