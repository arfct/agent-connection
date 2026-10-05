# agent-connection

How a person connects an agent host to an Artifact product, written once. A product hands over what it has (an MCP server, a REST API and OpenAPI document, a skill file, where tokens are made) and gets back the per-host instructions, a markdown guide for `/llms.txt`, an HTML page for a browser at its MCP URL, a ChatGPT app submission built from its tool list, and a web component that renders the settings panel.

Hosts: Claude (claude.ai connectors, Claude Code, the plugin marketplace), ChatGPT (connectors, Codex CLI), Gemini CLI (extensions, `mcp add`), Cursor, VS Code, Muse (Meta's agent, which has no MCP menu: a custom connector from the MCP URL or the OpenAPI document with a stored token; Muse Code reads the skill), and Other (any MCP client, or the REST API). The facts and their sources are in [docs/hosts.md](docs/hosts.md).

Plain ES modules with type declarations, no build step. Depend on it from git:

```
npm install github:arfct/agent-connection
```

## Use

Describe the product once:

```js
import { guideMarkdown, guideHtml, setupFor } from "@arfct/agent-connection";

const product = {
  name: "Menagerie",
  slug: "menagerie",
  origin: "https://menagerie.fyi",
  // mcp defaults to `${origin}/mcp`; pass null for a product without one
  api: "https://menagerie.fyi/api",
  openapi: "https://menagerie.fyi/openapi.yaml",
  skill: "https://menagerie.fyi/skill.md",
  settings: "https://menagerie.fyi/settings",
  source: "https://github.com/arfct/menagerie",
  marketplace: "arfct/menagerie",
};

guideMarkdown(product, { summary: "One line on what the product is." }); // /llms.txt
guideHtml(product);                                                       // GET /mcp from a browser
setupFor(product, "claude");                                              // { intro, snippets: [{label, text, href?}], note }
```

The panel, in any page (React included; import `@arfct/agent-connection/react` for the JSX types):

```html
<script type="module">import "@arfct/agent-connection/element";</script>
<agent-connection name="Menagerie" slug="menagerie" origin="https://menagerie.fyi"
  api="https://menagerie.fyi/api" openapi="https://menagerie.fyi/openapi.yaml"
  skill="https://menagerie.fyi/skill.md" settings="https://menagerie.fyi/settings"
  source="https://github.com/arfct/menagerie" marketplace="arfct/menagerie"></agent-connection>
```

Attributes mirror the product fields (`anonymous-mcp`, `token-name`, `no-mcp`); `host` picks the open tab; `anonymous` shows the tokenless endpoint when the product has one. Setting the `product` property replaces the attributes. It fires `hostchange` and `copy`. Theme it with custom properties on the element: `--agent-connection-accent`, `--agent-connection-on-accent`, `--agent-connection-muted`, `--agent-connection-line`, `--agent-connection-tonal`, `--agent-connection-radius`, `--agent-connection-field-radius`.

The ChatGPT submission, from the tool list the MCP server serves:

```js
import { buildSubmission } from "@arfct/agent-connection/chatgpt";
buildSubmission({ app_info, tools, justifications, test_cases, negative_test_cases });
```

`tools` carry `name`, `description`, `scope`, and `annotations` (`readOnlyHint`, `openWorldHint`, `destructiveHint`); justifications are derived from those and overridden per tool. A test case naming a tool the server lacks throws.

## Develop

```
npm install
npm test
npm run lint
```

A project of [Artifact](https://github.com/arfct). MIT.
