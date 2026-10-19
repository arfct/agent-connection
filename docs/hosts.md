# Hosts

What each host needs to connect, with where the fact came from and when it was last checked. `src/hosts.js` encodes this; change both.

"Server needs" lines are what a product's MCP and OAuth server must accept for that host to get through. They were learned connecting real hosts to Artifact products, and nothing in this package enforces them.

## Claude

- claude.ai and the Claude Code app share connectors: Settings → Connectors → Add custom connector. The dialog can be opened with the name and URL prefilled: `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=…&connectorUrl=…`. The person still reviews and confirms.
- Claude Code CLI: `claude mcp add --transport http <slug> <mcp url>`.
- A GitHub repo with `.claude-plugin/marketplace.json` is a plugin marketplace: `claude plugin marketplace add owner/repo && claude plugin install <name>@<marketplace>`. The plugin's `.mcp.json` adds the server and its `skills/` ship with it.
- OAuth 2.1 with a Client ID Metadata Document; the first tool call opens consent.
- Server needs: Claude Code's metadata document registers `http://localhost/callback`, then redirects to a port it picks at run time, so a loopback redirect must match on any port (RFC 8252 §7.3). claude.ai registers and exchanges tokens from the browser, so `/.well-known/*`, `/oauth/register`, `/oauth/token`, and `/mcp` need CORS. Source: arfct/vapor #91, and the CORS note in its `workers/oauth.ts`.
- Checked 2026-10-05 against arfct/vapor's working setup.

## ChatGPT and Codex

- ChatGPT app: Settings → Connectors → Advanced → Developer mode → Create, with the MCP URL and OAuth (or no authentication for a tokenless endpoint). Developer mode needs a paid plan. `https://chatgpt.com/#settings/Connectors` opens the page.
- Codex CLI: `codex mcp add <slug> --url <mcp url>`, then `codex mcp login <slug>`.
- Listing in the ChatGPT app directory: the submission JSON (schema `chatgpt-app-submission.v1`) with `app_info`, per-tool `annotations` and three justifications, test cases, and negative test cases; the server must publish `/.well-known/openai-apps-challenge` with the portal's token, and review has wanted `/oauth/userinfo` with `sub` and `email` plus OpenID discovery.
- Checked 2026-10-05 against arfct/vapor's submission.

## Gemini CLI

- `gemini extensions install <github repo url>` installs an extension from a repo with `gemini-extension.json` at its root (`mcpServers` with `httpUrl` and `oauth.enabled`) and `skills/` beside it.
- `gemini mcp add --transport http <slug> <mcp url>` adds the server alone.
- Server needs: Google's custom apps send `client_id` in HTTP Basic (with a secret to ignore) and may post JSON to the token endpoint. When the 401's `WWW-Authenticate` names no `scope`, Gemini asks for every scope the protected-resource metadata lists, so name the default scope there. Source: arfct/menagerie e24970d (#167).
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

- Launched 2026-09-08 with a curated connector list and no MCP menu, but it connects an MCP server when asked: "Connect <name> as an MCP server at <mcp url> and sign in when it asks." It builds the client on its own VM (Streamable HTTP, the MCP SDK) and follows OAuth discovery and dynamic registration. Without an MCP server it builds a REST client from an OpenAPI document, with the key in its Secure Credentials Store, entered through a prompt separate from the chat. Meta does not review custom connectors.
- Muse Code (2026-08-05) ships no MCP and reads a skills folder of `SKILL.md` files.
- Server needs:
  - Muse's sandbox sends `User-Agent: Python-urllib/…`. Cloudflare's Browser Integrity Check answers that with a 403, error 1010, before the Worker runs. Turn the check off for `/mcp`, `/oauth/`, and `/.well-known/` with a zone Configuration Rule, then check that `curl -A "Python-urllib/3.12" -X POST <mcp url>` returns 401, not 403. When registration fails this way, Muse's connect dialog falls back to asking the person for a client ID, which is the visible symptom. Seen on menagerie.fyi (arfct/menagerie 2193e7f, `docs/deploy.md`) and reproduced on subpixel.app 2026-10-19.
  - Authorize requests carry no `resource`: treat a missing one as the MCP URL.
  - It asks for OIDC scopes (`openid email profile`): drop scopes outside the product's vocabulary and grant the default instead of refusing. Source: arfct/menagerie `worker/src/oauth/server.ts`, tests in `worker/tests/apps.test.ts`.
- Sources: arfct/agent-connection #1 for the one-sentence connect; parallel.ai, "How to create custom integrations with Meta Muse" (2026-09-14) and "The best MCP servers and connectors for Meta Muse"; chatprd.ai, "Connect Meta Muse". Checked 2026-10-19. Not verified against Meta's own documentation; reopen when a Meta page can be cited.

## General

Shown as "General" (id `other`): the fallback for any client not listed.


- Any MCP client over Streamable HTTP takes the URL and follows the OAuth discovery (RFC 9728 → RFC 8414, PKCE S256, Client ID Metadata Documents or RFC 7591).
- Anything else takes the REST API with a personal token as a bearer, created by the person in the product's settings.
