import { readFile } from "node:fs/promises";
import { draftBriefFromText, formatBrief } from "./brief.mjs";

async function main() {
  const args = process.argv.slice(2);
  const flag = args[0];
  const value = args.slice(1).join(" ").trim();
  if (!flag) {
    console.error("Need --url, --topic, or --file");
    process.exitCode = 2;
    return;
  }

  if (flag === "--url") {
    const { fetchUrl: fu } = await import("./fetch-page.mjs");
    const page = await fu(value);
    const brief = draftBriefFromText({
      htmlOrText: page.body,
      source: { kind: "url", value: page.finalUrl },
      sourceUrl: page.finalUrl,
    });
    console.log(formatBrief(brief));
    return;
  }

  if (flag === "--topic") {
    const { fetchTopic: ft } = await import("./fetch-page.mjs");
    const page = await ft(value);
    const brief = draftBriefFromText({
      htmlOrText: page.body,
      source: { kind: "topic", value },
      sourceUrl: page.url,
      sourceTitle: page.title,
    });
    console.log(formatBrief(brief));
    return;
  }

  if (flag === "--file") {
    const body = await readFile(value, "utf8");
    const brief = draftBriefFromText({
      htmlOrText: body,
      source: { kind: "file", value },
    });
    console.log(formatBrief(brief));
    return;
  }

  console.error("Need --url, --topic, or --file");
  process.exitCode = 2;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
