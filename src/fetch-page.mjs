const UA = "t3n-research-brief-agent/0.1 (enterprise demo; +https://docs.terminal3.io)";
const MAX_BYTES = 400000;

export async function fetchUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL: " + url);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed.");
  }

  const res = await fetch(parsed, {
    redirect: "follow",
    headers: { "user-agent": UA, accept: "text/html,application/json,text/plain;q=0.9" },
  });
  if (!res.ok) {
    throw new Error("Fetch failed: HTTP " + res.status + " " + res.statusText + " for " + parsed.href);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    throw new Error("Source larger than " + MAX_BYTES + " bytes; pass a smaller page.");
  }
  return { body: buf.toString("utf8"), finalUrl: res.url || parsed.href };
}

export async function fetchTopic(topic) {
  const title = topic.trim();
  if (!title) throw new Error("Topic is empty.");
  const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
  const fetched = await fetchUrl(url);
  let parsed;
  try {
    parsed = JSON.parse(fetched.body);
  } catch {
    throw new Error("Wikipedia summary was not JSON. Try a URL instead.");
  }
  const extract = parsed.extract;
  if (!extract) {
    throw new Error("No Wikipedia summary for that topic. Try a more specific topic or a URL.");
  }
  const pageUrl = parsed.content_urls?.desktop?.page ?? url;
  const heading = parsed.title ?? title;
  const html =
    "<html><head><title>" +
    escapeHtml(heading) +
    "</title></head><body><h1>" +
    escapeHtml(heading) +
    "</h1><p>" +
    escapeHtml(extract) +
    "</p></body></html>";
  return { body: html, url: pageUrl, title: heading };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
