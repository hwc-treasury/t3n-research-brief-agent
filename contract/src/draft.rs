extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;

#[derive(serde::Deserialize)]
pub struct DraftReq {
    pub url: Option<String>,
    pub topic: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct GetReq {
    pub id: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq)]
pub struct CitedSource {
    pub title: String,
    pub url: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq)]
pub struct ResearchBrief {
    pub id: String,
    pub title: String,
    pub source_kind: String,
    pub source_value: String,
    pub fetched_at: String,
    pub problem: String,
    pub facts: Vec<String>,
    pub risks: Vec<String>,
    pub next_action: String,
    pub sources: Vec<CitedSource>,
    pub limits: String,
}

#[derive(serde::Serialize)]
pub struct ListResp {
    pub ids: Vec<String>,
}

const LIMITS: &str = "v1 is extractive (no LLM). It quotes and classifies sentences from the source. It does not browse beyond the given URL/topic, and it is not legal, security, or investment advice.";

pub fn parse_draft(input: &[u8]) -> Result<DraftReq, String> {
    serde_json::from_slice(input).map_err(|e| format!("draft-brief: bad input: {e}"))
}

pub fn strip_tags(html: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    let mut skip = false;
    let lower = html.to_ascii_lowercase();
    let bytes = html.as_bytes();
    let lowb = lower.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if !in_tag && matches_at(lowb, i, b"<script") {
            skip = true;
            in_tag = true;
            i += 1;
            continue;
        }
        if skip && matches_at(lowb, i, b"</script") {
            skip = false;
            in_tag = true;
            i += 1;
            continue;
        }
        if !in_tag && matches_at(lowb, i, b"<style") {
            skip = true;
            in_tag = true;
            i += 1;
            continue;
        }
        if skip && matches_at(lowb, i, b"</style") {
            skip = false;
            in_tag = true;
            i += 1;
            continue;
        }
        let c = bytes[i] as char;
        if c == '<' {
            in_tag = true;
        } else if c == '>' {
            in_tag = false;
            out.push(' ');
        } else if !in_tag && !skip {
            out.push(c);
        }
        i += 1;
    }
    collapse_ws(&out)
}

fn matches_at(hay: &[u8], i: usize, needle: &[u8]) -> bool {
    hay.get(i..).map(|s| s.starts_with(needle)).unwrap_or(false)
}

fn collapse_ws(s: &str) -> String {
    let mut out = String::new();
    let mut prev_space = true;
    for c in s.chars() {
        if c.is_whitespace() {
            if !prev_space {
                out.push(' ');
                prev_space = true;
            }
        } else {
            out.push(c);
            prev_space = false;
        }
    }
    out.trim().to_string()
}

pub fn extract_title(html: &str, fallback: &str) -> String {
    if let Some(t) = between(html, "<title", "</title>") {
        let stripped = strip_tags(&format!("<span>{t}</span>"));
        if !stripped.is_empty() {
            return stripped;
        }
    }
    if let Some(t) = between(html, "<h1", "</h1>") {
        let stripped = strip_tags(&format!("<span>{t}</span>"));
        if !stripped.is_empty() {
            return stripped;
        }
    }
    fallback.to_string()
}

fn between<'a>(hay: &'a str, start: &str, end: &str) -> Option<&'a str> {
    let lower = hay.to_ascii_lowercase();
    let s = lower.find(&start.to_ascii_lowercase())?;
    let after = hay[s..].find('>')? + s + 1;
    let e = lower[after..].find(&end.to_ascii_lowercase())? + after;
    Some(&hay[after..e])
}

pub fn split_sentences(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    for c in text.chars() {
        cur.push(c);
        if matches!(c, '.' | '!' | '?') && cur.len() >= 40 {
            let t = cur.trim().to_string();
            if t.len() <= 600 {
                out.push(truncate(&t, 240));
            }
            cur.clear();
        }
    }
    let t = cur.trim().to_string();
    if t.len() >= 40 && t.len() <= 600 {
        out.push(truncate(&t, 240));
    }
    out
}

fn truncate(s: &str, n: usize) -> String {
    if s.len() <= n {
        s.to_string()
    } else {
        format!("{}…", s.chars().take(n).collect::<String>().trim())
    }
}

fn has_any(s: &str, words: &[&str]) -> bool {
    let low = s.to_ascii_lowercase();
    words.iter().any(|w| low.contains(w))
}

pub fn draft_from_text(
    text_or_html: &str,
    source_kind: &str,
    source_value: &str,
    source_url: Option<&str>,
    fetched_at: &str,
) -> ResearchBrief {
    let looks_html = text_or_html.to_ascii_lowercase().contains("<html")
        || text_or_html.to_ascii_lowercase().contains("<p")
        || text_or_html.to_ascii_lowercase().contains("<h1");
    let title = if looks_html {
        extract_title(text_or_html, source_value)
    } else {
        source_value.to_string()
    };
    let text = if looks_html {
        strip_tags(text_or_html)
    } else {
        collapse_ws(text_or_html)
    };
    let sentences = split_sentences(&text);
    let problem = sentences
        .iter()
        .find(|s| has_any(s, &["problem", "issue", "challenge", "fail", "outage", "incident"]))
        .cloned()
        .or_else(|| sentences.first().cloned())
        .unwrap_or_else(|| format!("Need a one-page read on {source_value}."));

    let mut facts = Vec::new();
    for s in &sentences {
        if s != &problem
            && (has_any(s, &["%", "customers", "users", "sla", "soc 2", "gdpr", "2024", "2025", "2026"])
                || facts.len() < 4)
        {
            if !facts.iter().any(|f| f == s) {
                facts.push(s.clone());
            }
        }
        if facts.len() >= 6 {
            break;
        }
    }
    if facts.is_empty() {
        facts.push(problem.clone());
    }

    let mut risks = Vec::new();
    for s in &sentences {
        if s != &problem
            && has_any(s, &["risk", "legal", "compliance", "security", "privacy", "breach", "downtime"])
            && !risks.iter().any(|r| r == s)
        {
            risks.push(s.clone());
        }
        if risks.len() >= 4 {
            break;
        }
    }
    if risks.is_empty() {
        risks.push(
            "Extractive brief only — claims are not independently verified and may omit material context."
                .to_string(),
        );
    }

    let next_action = sentences
        .iter()
        .find(|s| {
            *s != &problem
                && has_any(s, &["should", "must", "recommend", "next step", "review", "verify", "assign"])
        })
        .cloned()
        .unwrap_or_else(|| {
            "Assign an owner to verify the facts against the source, then decide go / no-go / more diligence."
                .to_string()
        });

    let id = simple_id(source_kind, source_value, &title);
    ResearchBrief {
        id,
        title: title.clone(),
        source_kind: source_kind.to_string(),
        source_value: source_value.to_string(),
        fetched_at: fetched_at.to_string(),
        problem,
        facts,
        risks,
        next_action,
        sources: alloc::vec![CitedSource {
            title,
            url: source_url.map(|s| s.to_string()),
        }],
        limits: LIMITS.to_string(),
    }
}

fn simple_id(kind: &str, value: &str, title: &str) -> String {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in kind.bytes().chain(value.bytes()).chain(title.bytes()) {
        h ^= b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    format!("{h:016x}")
}

pub fn draft_brief(input: &[u8]) -> Result<Vec<u8>, String> {
    let req = parse_draft(input)?;
    if req.url.is_none() && req.topic.is_none() {
        return Err("draft-brief: provide url or topic".to_string());
    }
    if let Some(url) = &req.url {
        if !(url.starts_with("https://") || url.starts_with("http://")) {
            return Err("draft-brief: url must be http(s)".to_string());
        }
    }

    #[cfg(target_arch = "wasm32")]
    {
        let brief = draft_brief_wasm(req)?;
        persist_brief(&brief)?;
        return serde_json::to_vec(&brief).map_err(|e| e.to_string());
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        let _ = req;
        Err("draft_brief HTTP path is only implemented on wasm32".to_string())
    }
}

pub fn get_brief(input: &[u8]) -> Result<Vec<u8>, String> {
    let req: GetReq =
        serde_json::from_slice(input).map_err(|e| format!("get-brief: bad input: {e}"))?;
    if req.id.is_empty() {
        return Err("get-brief: id required".to_string());
    }

    #[cfg(target_arch = "wasm32")]
    {
        return load_brief(&req.id);
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        let _ = req;
        Err("get_brief is only implemented on wasm32".to_string())
    }
}

pub fn list_briefs(_input: &[u8]) -> Result<Vec<u8>, String> {
    #[cfg(target_arch = "wasm32")]
    {
        return list_briefs_wasm();
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        Err("list_briefs is only implemented on wasm32".to_string())
    }
}

#[cfg(target_arch = "wasm32")]
use crate::host::{
    interfaces::{http as http_iface, kv_store, logging},
    tenant::tenant_context,
};

#[cfg(target_arch = "wasm32")]
fn map_name() -> String {
    let tid = tenant_context::tenant_did();
    format!("z:{}:briefs", hex::encode(&tid))
}

#[cfg(target_arch = "wasm32")]
fn persist_brief(brief: &ResearchBrief) -> Result<(), String> {
    let bytes = serde_json::to_vec(brief).map_err(|e| e.to_string())?;
    kv_store::put(&map_name(), brief.id.as_bytes(), &bytes)
        .map_err(|e| format!("kv put: {e}"))?;
    let _ = logging::info(&format!("stored brief {}", brief.id));
    Ok(())
}

#[cfg(target_arch = "wasm32")]
fn load_brief(id: &str) -> Result<Vec<u8>, String> {
    let bytes = kv_store::get(&map_name(), id.as_bytes())
        .map_err(|e| format!("kv get: {e}"))?
        .ok_or_else(|| format!("brief not found: {id}"))?;
    Ok(bytes)
}

#[cfg(target_arch = "wasm32")]
fn list_briefs_wasm() -> Result<Vec<u8>, String> {
    let rows = kv_store::scan(&map_name(), &[], &[0xff], 20)
        .map_err(|e| format!("kv scan: {e}"))?;
    let ids = rows
        .into_iter()
        .filter_map(|(k, _)| String::from_utf8(k).ok())
        .collect();
    serde_json::to_vec(&ListResp { ids }).map_err(|e| e.to_string())
}

#[cfg(target_arch = "wasm32")]
fn http_get(url: &str) -> Result<String, String> {
    let resp = http_iface::call(&http_iface::Request {
        method: http_iface::Verb::Get,
        url: url.to_string(),
        headers: Some(alloc::vec![(
            "User-Agent".to_string(),
            "t3n-research-brief-agent/0.1".to_string(),
        )]),
        payload: None,
    })
    .map_err(|e| format!("http get: {e}"))?;
    if resp.code != 200 {
        let body = String::from_utf8_lossy(&resp.payload);
        return Err(format!("HTTP {} — {body}", resp.code));
    }
    if resp.payload.len() > 400_000 {
        return Err("source too large".to_string());
    }
    String::from_utf8(resp.payload).map_err(|e| e.to_string())
}

#[cfg(target_arch = "wasm32")]
fn draft_brief_wasm(req: DraftReq) -> Result<ResearchBrief, String> {
    let ts = tenant_context::cluster_timestamp_secs().to_string();
    if let Some(url) = req.url {
        let body = http_get(&url)?;
        return Ok(draft_from_text(&body, "url", &url, Some(&url), &ts));
    }
    let topic = req.topic.unwrap();
    let encoded = urlencode(&topic);
    let api = format!("https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}");
    let body = http_get(&api)?;
    Ok(draft_from_text(&body, "topic", &topic, Some(&api), &ts))
}

#[cfg(target_arch = "wasm32")]
fn urlencode(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char)
            }
            b' ' => out.push_str("%20"),
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_non_json() {
        let err = draft_brief(b"not json").unwrap_err();
        assert!(err.contains("bad input"));
    }

    #[test]
    fn rejects_missing_source() {
        let err = draft_brief(br#"{"foo":1}"#).unwrap_err();
        assert!(err.contains("url or topic"));
    }

    #[test]
    fn rejects_bad_url() {
        let err = draft_brief(br#"{"url":"ftp://x"}"#).unwrap_err();
        assert!(err.contains("http(s)"));
    }

    #[test]
    fn extracts_problem_facts_risks() {
        let html = r#"<html><head><title>Vendor outage memo</title></head><body>
        <p>The problem is a 14-hour outage that hit 12000 customers in 2026.</p>
        <p>Uptime dropped below the 99.9% SLA and a security review is required.</p>
        <p>Legal and compliance should review the incident report this week.</p>
        </body></html>"#;
        let brief = draft_from_text(html, "file", "memo.html", None, "0");
        assert_eq!(brief.title, "Vendor outage memo");
        assert!(brief.problem.to_ascii_lowercase().contains("problem"));
        assert!(!brief.facts.is_empty());
        assert!(!brief.risks.is_empty());
        assert!(brief.next_action.to_ascii_lowercase().contains("should") || brief.next_action.to_ascii_lowercase().contains("review"));
    }
}
