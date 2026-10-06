// The agent hosts a person might connect, and what each needs. One table
// feeds a product's settings panel, its /llms.txt guide, and the page a
// browser sees at its MCP URL, so the instructions a person reads and the
// ones an agent reads never disagree. Facts about each host and their
// sources are in docs/hosts.md; change them there and here together.

/** @typedef {import("./index.js").Product} Product */
/** @typedef {import("./index.js").HostId} HostId */
/** @typedef {import("./index.js").Host} Host */
/** @typedef {import("./index.js").Setup} Setup */
/** @typedef {import("./index.js").Snippet} Snippet */

/** @type {Host[]} */
export const HOSTS = [
  { id: "claude", label: "Claude", mcp: true },
  { id: "chatgpt", label: "ChatGPT", mcp: true },
  { id: "gemini", label: "Gemini", mcp: true },
  { id: "cursor", label: "Cursor", mcp: true },
  { id: "vscode", label: "VS Code", mcp: true },
  { id: "muse", label: "Muse", mcp: false },
  { id: "other", label: "Other", mcp: true },
];

export const CHATGPT_CONNECTORS_URL = "https://chatgpt.com/#settings/Connectors";

/** @param {string} id */
export function hostById(id) {
  return HOSTS.find((h) => h.id === id) ?? HOSTS[HOSTS.length - 1];
}

/**
 * Which host a connecting MCP client is, from the name it declares in
 * `clientInfo.name` ("claude-code", "Cursor", "codex-cli"). Unknown is "other".
 * @param {string | null | undefined} clientName
 * @returns {HostId}
 */
export function hostForClientName(clientName) {
  const slug = (clientName ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (!slug) return "other";
  /** @type {[HostId, string[]][]} */
  const matches = [
    ["claude", ["claude"]],
    ["chatgpt", ["chatgpt", "codex", "openai"]],
    ["gemini", ["gemini"]],
    ["cursor", ["cursor"]],
    ["vscode", ["vscode", "visual-studio-code", "copilot"]],
    ["muse", ["muse"]],
  ];
  for (const [id, needles] of matches) if (needles.some((n) => slug.includes(n))) return id;
  return "other";
}

/**
 * The endpoints a product exposes, with the ones it did not name derived
 * from its origin where a convention exists.
 * @param {Product} p
 */
export function endpoints(p) {
  const origin = p.origin.replace(/\/$/, "");
  return {
    origin,
    mcp: p.mcp === null ? null : (p.mcp ?? `${origin}/mcp`),
    anonymousMcp: p.anonymousMcp ?? null,
    api: p.api ?? null,
    openapi: p.openapi ?? null,
    skill: p.skill ?? null,
    settings: p.settings ?? null,
    source: p.source ?? null,
    marketplace: p.marketplace ?? null,
    tokenName: p.tokenName ?? `${p.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_TOKEN`,
  };
}

/** The claude.ai dialog with the connector name and URL filled in; the person reviews and confirms. */
export function claudeConnectorLink(name, mcpUrl) {
  return `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(name)}&connectorUrl=${encodeURIComponent(mcpUrl)}`;
}

export function cursorInstallLink(slug, mcpUrl) {
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(slug)}&config=${btoa(JSON.stringify({ url: mcpUrl }))}`;
}

export function vscodeInstallLink(slug, mcpUrl) {
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: slug, type: "http", url: mcpUrl }))}`;
}

/**
 * The setup for one host: a sentence, the lines to copy, a closing note.
 * The MCP URL used is the product's signed-in one unless `anonymous` asks
 * for the tokenless endpoint the product may offer.
 * @param {Product} p
 * @param {HostId} host
 * @param {{ anonymous?: boolean }} [opts]
 * @returns {Setup}
 */
export function setupFor(p, host, opts = {}) {
  const e = endpoints(p);
  const mcp = opts.anonymous && e.anonymousMcp ? e.anonymousMcp : e.mcp;
  const servers = mcp ? JSON.stringify({ mcpServers: { [p.slug]: { type: "http", url: mcp } } }) : null;
  /** @type {Snippet[]} */
  const api = [];
  if (e.api) api.push({ label: "REST API", text: e.api });
  if (e.openapi) api.push({ label: "OpenAPI document", text: e.openapi });
  if (e.skill) api.push({ label: "Agent skill", text: e.skill });
  const tokenNote = e.settings
    ? `Personal tokens are created at ${e.settings} and act as you within their scopes.`
    : "A personal token acts as you within its scopes.";
  const signIn = opts.anonymous ? "" : " The first tool call opens a sign-in and consent screen.";

  switch (host) {
    case "claude": {
      if (!mcp) return apiOnly(p, "Claude", api, tokenNote);
      /** @type {Snippet[]} */
      const snippets = [
        { label: "Settings → Connectors → Add custom connector", text: mcp, href: claudeConnectorLink(p.name, mcp) },
        { label: "Claude Code", text: `claude mcp add --transport http ${p.slug} ${mcp}` },
      ];
      if (e.marketplace)
        snippets.push({
          label: "Or the plugin, with the skill",
          text: `claude plugin marketplace add ${e.marketplace} && claude plugin install ${p.slug}@${p.slug}`,
        });
      return {
        intro: "Claude and the Claude Code app share claude.ai's connectors; the command line adds the server directly.",
        snippets,
        note: signIn.trim() || undefined,
      };
    }
    case "chatgpt": {
      if (!mcp) return apiOnly(p, "ChatGPT", api, tokenNote);
      return {
        intro: `In the ChatGPT app, create a connector with this URL${opts.anonymous ? " and no authentication" : " and OAuth"}; Codex takes the same URL from the command line.`,
        snippets: [
          { label: "Settings → Connectors → Advanced → Developer mode → Create", text: mcp, href: CHATGPT_CONNECTORS_URL },
          { label: "Codex CLI", text: `codex mcp add ${p.slug} --url ${mcp}` },
        ],
        note: opts.anonymous
          ? "Developer mode needs a paid plan."
          : `Then sign in when ChatGPT asks, or run codex mcp login ${p.slug}. Developer mode needs a paid plan.`,
      };
    }
    case "gemini": {
      if (!mcp) return apiOnly(p, "Gemini", api, tokenNote);
      /** @type {Snippet[]} */
      const snippets = [];
      if (e.source && !opts.anonymous) snippets.push({ label: "Extension, with the skill", text: `gemini extensions install ${e.source}` });
      snippets.push({ label: e.source && !opts.anonymous ? "Server only" : "Gemini CLI", text: `gemini mcp add --transport http ${p.slug} ${mcp}` });
      return {
        intro: e.source ? "The extension carries the skill as well as the server; the plain add is the server only." : "Gemini CLI adds the server directly.",
        snippets,
      };
    }
    case "cursor": {
      if (!mcp) return apiOnly(p, "Cursor", api, tokenNote);
      return {
        intro: "One click, or the same JSON in .cursor/mcp.json.",
        snippets: [
          { label: "Add to Cursor", text: cursorInstallLink(p.slug, mcp), href: cursorInstallLink(p.slug, mcp) },
          { label: "Or .cursor/mcp.json", text: /** @type {string} */ (servers) },
        ],
        note: opts.anonymous ? undefined : "Sign in from Settings → MCP.",
      };
    }
    case "vscode": {
      if (!mcp) return apiOnly(p, "VS Code", api, tokenNote);
      return {
        intro: "One click, or the same JSON in .vscode/mcp.json.",
        snippets: [
          { label: "Add to VS Code", text: vscodeInstallLink(p.slug, mcp), href: vscodeInstallLink(p.slug, mcp) },
          { label: "Or .vscode/mcp.json", text: JSON.stringify({ servers: { [p.slug]: { type: "http", url: mcp } } }) },
        ],
      };
    }
    case "muse": {
      // Meta's Muse has no MCP menu, but it will connect an MCP server when
      // asked: one sentence to say to it is the whole setup. Muse Code reads
      // a skills folder. Without an MCP server, the API with a key in Muse's
      // Secure Credentials Store.
      /** @type {Snippet[]} */
      const snippets = [];
      if (mcp) snippets.push({ label: "Say to Muse", text: `Connect ${p.name} as an MCP server at ${mcp} and sign in when it asks.` });
      else {
        if (e.openapi) snippets.push({ label: "OpenAPI document", text: e.openapi });
        if (e.api) snippets.push({ label: "Base URL", text: e.api });
        if (e.api || e.openapi) snippets.push({ label: "Credential name for a personal token", text: e.tokenName });
      }
      if (e.skill) snippets.push({ label: "Muse Code: the skill", text: e.skill });
      return {
        intro: mcp ? `Ask Muse to connect ${mcp}.` : "Muse has no MCP menu. Ask it for a custom connector to the API, with a personal token stored through its credential prompt.",
        snippets,
        note: !mcp && (e.api || e.openapi) ? `${tokenNote} The key goes into Muse's Secure Credentials Store, never into the chat.` : undefined,
      };
    }
    default: {
      /** @type {Snippet[]} */
      const snippets = [];
      if (servers) snippets.push({ label: "MCP configuration", text: servers });
      snippets.push(...api);
      return {
        intro: mcp
          ? `Any MCP client over HTTP takes the same URL${opts.anonymous ? "" : " and follows the OAuth flow it discovers"}${api.length ? "; anything else takes the REST API with a personal token as a bearer" : ""}.`
          : "Anything that can call an HTTP API takes it with a personal token as a bearer.",
        snippets,
        note: api.length && !opts.anonymous ? tokenNote : undefined,
      };
    }
  }
}

/**
 * The fallback for an MCP-only host when the product has no MCP server.
 * @param {Product} p
 * @param {string} label
 * @param {Snippet[]} api
 * @param {string} tokenNote
 * @returns {Setup}
 */
function apiOnly(p, label, api, tokenNote) {
  return {
    intro: `${p.name} has no MCP server; ${label} can still call the REST API with a personal token.`,
    snippets: api,
    note: api.length ? tokenNote : undefined,
  };
}
