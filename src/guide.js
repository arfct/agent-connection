// The guide for agents and people: the same host table as markdown
// (for /llms.txt, and for `curl <origin>/mcp`) and as a plain HTML page
// (for a browser at the MCP URL). Everything interpolated is escaped.

import { endpoints, HOSTS, setupFor } from "./hosts.js";

/** @typedef {import("./index.js").Product} Product */

/**
 * @param {Product} p
 * @param {{ summary?: string; anonymous?: boolean }} [opts] A line about what the product is, and whether to show the tokenless endpoint.
 */
export function guideMarkdown(p, opts = {}) {
  const e = endpoints(p);
  const lines = [`# ${p.name} for agents`, ""];
  if (opts.summary) lines.push(opts.summary, "");
  if (e.mcp) lines.push(`- MCP server: ${e.mcp} (Streamable HTTP, OAuth 2.1)`);
  if (e.anonymousMcp) lines.push(`- Anonymous MCP server: ${e.anonymousMcp} (no account)`);
  if (e.api)
    lines.push(
      `- REST API: ${e.api}${e.openapi ? `, described by ${e.openapi}` : ""}${e.settings ? `; a personal token from ${e.settings} is the bearer` : ""}`,
    );
  if (e.skill) lines.push(`- Agent skill: ${e.skill}`);
  if (e.source) lines.push(`- Source: ${e.source}`);
  lines.push("");
  for (const h of HOSTS) {
    const s = setupFor(p, h.id, { anonymous: opts.anonymous });
    if (s.snippets.length === 0) continue;
    lines.push(`## ${h.label}`, "", s.intro, "");
    for (const sn of s.snippets) lines.push(`${sn.label}:`, "", "```", sn.text, "```", "");
    if (s.note) lines.push(s.note, "");
  }
  return lines.join("\n");
}

/** @param {string} s */
export const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * The guide as HTML: headings, paragraphs, lists, and code blocks from the
 * markdown above, in a page that follows the system color scheme. Pass
 * `css` to restyle it; the structure is `main > h1, h2, p, ul, pre`.
 * @param {Product} p
 * @param {{ summary?: string; anonymous?: boolean; css?: string }} [opts]
 */
export function guideHtml(p, opts = {}) {
  const md = guideMarkdown(p, opts);
  const out = [];
  let inCode = false;
  let inList = false;
  for (const raw of md.split("\n")) {
    if (raw.startsWith("```")) {
      out.push(inCode ? "</pre>" : "<pre>");
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(raw));
      continue;
    }
    if (raw.startsWith("- ")) {
      if (!inList) out.push("<ul>");
      inList = true;
      out.push(`<li>${escapeHtml(raw.slice(2))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (raw.startsWith("# ")) out.push(`<h1>${escapeHtml(raw.slice(2))}</h1>`);
    else if (raw.startsWith("## ")) out.push(`<h2>${escapeHtml(raw.slice(3))}</h2>`);
    else if (raw.trim()) out.push(`<p>${escapeHtml(raw)}</p>`);
  }
  if (inList) out.push("</ul>");
  const css =
    opts.css ??
    `:root{--bg:#fafaf9;--fg:#1c1917;--muted:#78716c;--line:#e7e5e4;--card:#fff}@media(prefers-color-scheme:dark){:root{--bg:#0c0a09;--fg:#f5f5f4;--muted:#a8a29e;--line:#292524;--card:#1c1917}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:640px;margin:0 auto;padding:40px 20px 80px}h1{font-size:24px;margin:0 0 8px}h2{font-size:17px;margin:32px 0 6px}p{margin:8px 0}pre{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 14px;overflow-x:auto;font:13px ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-all}ul{padding-left:20px}`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(p.name)} for agents</title>
<style>${css}</style>
<body><main>${out.join("\n")}</main></body></html>`;
}
