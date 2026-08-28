import { createHash } from "node:crypto";
import type { BriefSource, ResearchBrief } from "./types.ts";

const PROBLEM_RE =
  /\b(problem|issue|challenge|gap|fail|outage|incident|concern|bottleneck|blocker)\b/i;
const RISK_RE =
  /\b(risk|legal|compliance|security|privacy|exposure|liability|cost overrun|vendor lock|downtime|breach)\b/i;
const ACTION_RE =
  /\b(should|must|recommend|next step|assign|migrate|patch|tabletop|go \/ no-go)\b/i;
const FACT_RE =
  /\b(\d+%|\$\d|\d{4}|customers|users|sla|latency|uptime|soc 2|iso 27001|gdpr)\b/i;

const MAX_FACTS = 6;
const MAX_RISKS = 4;
const MAX_SENTENCE = 240;

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|h[1-6]|li|br|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function extractTitle(html: string, fallback: string): string {
  const og = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,
  );
  if (og?.[1]) return decode(og[1]).trim();
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t?.[1]) return stripHtml(t[1]).trim() || fallback;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) return stripHtml(h1[1]).trim() || fallback;
  return fallback;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"-])/))
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 40 && s.length <= 600)
    .map((s) => (s.length > MAX_SENTENCE ? `${s.slice(0, MAX_SENTENCE).trim()}…` : s));
}

function takeUnique(items: string[], n: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= n) break;
  }
  return out;
}

export function draftBriefFromText(opts: {
  htmlOrText: string;
  source: BriefSource;
  fetchedAt?: string;
  sourceUrl?: string;
  sourceTitle?: string;
}): ResearchBrief {
  const htmlOrText = opts.htmlOrText;
  const looksHtml = /<html|<body|<article|<p[\s>]|<h1/i.test(htmlOrText);
  const title = opts.sourceTitle
    ? opts.sourceTitle
    : looksHtml
      ? extractTitle(htmlOrText, fallbackTitle(opts.source))
      : fallbackTitle(opts.source);
  const text = looksHtml ? stripHtml(htmlOrText) : htmlOrText.replace(/\s+/g, " ").trim();
  const sentences = splitSentences(text);

  const problem =
    sentences.find((s) => PROBLEM_RE.test(s)) ??
    sentences[0] ??
    `Need a one-page read on ${opts.source.value} so an owner can decide the next action.`;

  const facts = takeUnique(
    [
      ...sentences.filter((s) => FACT_RE.test(s)),
      ...sentences.filter((s) => s !== problem).slice(0, 4),
    ],
    MAX_FACTS,
  );

  const risks = takeUnique(
    sentences.filter((s) => RISK_RE.test(s) && s !== problem),
    MAX_RISKS,
  );

  const nextAction =
    sentences.find((s) => ACTION_RE.test(s) && s !== problem) ??
    "Assign an owner to verify the facts against the source, then decide go / no-go / more diligence.";

  const id = createHash("sha256")
    .update(`${opts.source.kind}:${opts.source.value}:${title}`)
    .digest("hex")
    .slice(0, 16);

  return {
    id,
    title,
    source: opts.source,
    fetchedAt: opts.fetchedAt ?? new Date().toISOString(),
    problem,
    facts: facts.length ? facts : [problem],
    risks: risks.length
      ? risks
      : [
          "Extractive brief only — claims are not independently verified and may omit material context.",
        ],
    nextAction,
    sources: [
      {
        title,
        url: opts.sourceUrl ?? (opts.source.kind === "url" ? opts.source.value : undefined),
      },
    ],
    limits:
      "v1 is extractive (no LLM). It quotes and classifies sentences from the source. It does not browse beyond the given URL/topic, and it does not treat the brief as legal, security, or investment advice.",
  };
}

function fallbackTitle(source: BriefSource): string {
  if (source.kind === "url") {
    try {
      return new URL(source.value).hostname;
    } catch {
      return source.value.slice(0, 80);
    }
  }
  return source.value.slice(0, 80);
}

export function formatBrief(brief: ResearchBrief): string {
  const lines = [
    `# Research brief: ${brief.title}`,
    "",
    `Source: ${brief.source.kind} · ${brief.source.value}`,
    `Fetched: ${brief.fetchedAt}`,
    `Id: ${brief.id}`,
    "",
    "## Problem",
    brief.problem,
    "",
    "## Facts",
    ...brief.facts.map((f, i) => `${i + 1}. ${f}`),
    "",
    "## Risks",
    ...brief.risks.map((r) => `- ${r}`),
    "",
    "## Next action",
    brief.nextAction,
    "",
    "## Sources",
    ...brief.sources.map((s) => `- ${s.title}${s.url ? ` — ${s.url}` : ""}`),
    "",
    "## Limits",
    brief.limits,
  ];
  return lines.join("\n");
}
