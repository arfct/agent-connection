# Hosts

What each host needs to connect, with where the fact came from and when it was last checked. `src/hosts.js` encodes this; change both.

## Claude

- claude.ai and the Claude Code app share connectors: Settings → Connectors → Add custom connector. The dialog can be opened with the name and URL prefilled: `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=…&connectorUrl=…`. The person still reviews and confirms.
- Claude Code CLI: `claude mcp add --transport http <slug> <mcp url>`.
- A GitHub repo with `.claude-plugin/marketplace.json` is a plugin marketplace: `claude plugin marketplace add owner/repo && claude plugin install <name>@<marketplace>`. The plugin's `.mcp.json` adds the server and its `skills/` ship with it.
- OAuth 2.1 with a Client ID Metadata Document; the first tool call opens consent.
- Checked 2026-10-05 against arfct/vapor's working setup.

## ChatGPT and Codex

- ChatGPT app: Settings → Connectors → Advanced → Developer mode → Create, with the MCP URL and OAuth (or no authentication for a tokenless endpoint). Developer mode needs a paid plan. `https://chatgpt.com/#settings/Connectors` opens the page.
- Codex CLI: `codex mcp add <slug> --url <mcp url>`, then `codex mcp login <slug>`.
- Listing in the ChatGPT app directory: the submission JSON (schema `chatgpt-app-submission.v1`) with `app_info`, per-tool `annotations` and three justifications, test cases, and negative test cases; the server must publish `/.well-known/openai-apps-challenge` with the portal's token, and review has wanted `/oauth/userinfo` with `sub` and `email` plus OpenID discovery.
- Checked 2026-10-05 against arfct/vapor's submission.

## Gemini CLI

- `gemini extensions install <github repo url>` installs an extension from a repo with `gemini-extension.json` at its root (`mcpServers` with `httpUrl` and `oauth.enabled`) and `skills/` beside it.
- `gemini mcp add --transport http <slug> <mcp url>` adds the server alone.
- Checked 2026-10-05.

## Cursor

- One-click: `cursor://anysphere.cursor-deeplink/mcp/install?name=<slug>&config=<base64 of {"url": …}>`.
- Or `.cursor/mcp.json`: `{"mcpServers": {"<slug>": {"type": "http", "url": …}}}`. Sign-in from Settings → MCP.
- Checked 2026-10-05.

## VS Code

- One-click: `vscode:mcp/install?<url-encoded {"name","type":"http","url"}>`.
- Or `.vscode/mcp.json`: `{"servers": {"<slug>": {"type": "http", "url": …}}}`.
- Checked 2026-10-05.

## Muse (Meta)

- Launched 2026-09-08 with a curated connector list and no MCP menu. Custom Connector: the person asks Muse for one and describes the service; Muse builds a client on its own VM, for an MCP server over Streamable HTTP (with the MCP SDK) or for a REST API from an OpenAPI document. Credentials go into Muse's Secure Credentials Store through a prompt separate from the chat; a surrogate replaces the key at the network boundary. Meta does not review custom connectors.
- Muse Code (2026-08-05) ships no MCP and reads a skills folder of `SKILL.md` files.
- Sources: parallel.ai, "How to create custom integrations with Meta Muse" (2026-09-14) and "The best MCP servers and connectors for Meta Muse"; chatprd.ai, "Connect Meta Muse". Checked 2026-10-05. Not verified against Meta's own documentation; reopen when a Meta page can be cited.

## Other

- Any MCP client over Streamable HTTP takes the URL and follows the OAuth discovery (RFC 9728 → RFC 8414, PKCE S256, Client ID Metadata Documents or RFC 7591).
- Anything else takes the REST API with a personal token as a bearer, created by the person in the product's settings.
