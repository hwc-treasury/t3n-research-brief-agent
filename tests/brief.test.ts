import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { draftBriefFromText, formatBrief, stripHtml } from "../src/brief.ts";

const fixture = readFileSync(new URL("../fixtures/sample-vendor.html", import.meta.url), "utf8");

describe("research brief", () => {
  it("strips tags and keeps prose", () => {
    const text = stripHtml(fixture);
    assert.match(text, /Northwind/);
    assert.doesNotMatch(text, /<p>/);
  });

  it("emits problem, facts, risks, next action", () => {
    const brief = draftBriefFromText({
      htmlOrText: fixture,
      source: { kind: "file", value: "fixtures/sample-vendor.html" },
    });
    assert.match(brief.title, /Northwind Payments/);
    assert.match(brief.problem.toLowerCase(), /problem|outage/);
    assert.ok(brief.facts.length >= 1);
    assert.ok(brief.risks.some((r) => /risk|privacy|security|lock/i.test(r)));
    assert.match(brief.nextAction.toLowerCase(), /assign|should|recommend|next/);
    const page = formatBrief(brief);
    assert.match(page, /## Problem/);
    assert.match(page, /## Next action/);
  });
});
