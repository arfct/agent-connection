import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSubmission } from "../src/chatgpt.js";
import { endpoints, guideHtml, guideMarkdown, HOSTS, hostForClientName, setupFor } from "../src/index.js";

const full = {
  name: "Menagerie",
  slug: "menagerie",
  origin: "https://menagerie.fyi",
  api: "https://menagerie.fyi/api",
  openapi: "https://menagerie.fyi/openapi.yaml",
  skill: "https://menagerie.fyi/skill.md",
  settings: "https://menagerie.fyi/settings",
  source: "https://github.com/arfct/menagerie",
  marketplace: "arfct/menagerie",
};
const mcpOnly = {
  name: "vapor",
  slug: "vapor",
  origin: "https://vapor.fyi",
  anonymousMcp: "https://vapor.fyi/mcp/anonymous",
  source: "https://github.com/arfct/vapor",
};
const apiOnly = {
  name: "Ledger",
  slug: "ledger",
  origin: "https://ledger.example",
  mcp: null,
  api: "https://ledger.example/api",
  openapi: "https://ledger.example/openapi.json",
};

describe("endpoints", () => {
  it("derives the MCP URL from the origin and the token name from the slug", () => {
    const e = endpoints(mcpOnly);
    assert.equal(e.mcp, "https://vapor.fyi/mcp");
    assert.equal(e.tokenName, "VAPOR_TOKEN");
    assert.equal(endpoints(apiOnly).mcp, null);
    assert.equal(endpoints({ ...full, origin: "https://x.test/" }).mcp, "https://x.test/mcp");
  });
});

describe("setupFor", () => {
  it("gives every host at least one snippet for a full product, each naming the product's URLs", () => {
    for (const h of HOSTS) {
      const s = setupFor(full, h.id);
      assert.ok(s.snippets.length > 0, h.id);
      assert.ok(
        s.snippets.some((sn) => sn.text.includes("menagerie.fyi")),
        h.id,
      );
    }
  });

  it("links the one-click installs and the connector dialogs", () => {
    const claude = setupFor(full, "claude");
    assert.match(
      claude.snippets[0].href,
      /^https:\/\/claude\.ai\/customize\/connectors\?modal=add-custom-connector&connectorName=Menagerie&connectorUrl=https%3A%2F%2Fmenagerie\.fyi%2Fmcp$/,
    );
    assert.equal(claude.snippets[1].text, "claude mcp add --transport http menagerie https://menagerie.fyi/mcp");
    assert.equal(claude.snippets[2].text, "claude plugin marketplace add arfct/menagerie && claude plugin install menagerie@menagerie");
    assert.match(setupFor(full, "cursor").snippets[0].href, /^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=menagerie&config=/);
    assert.match(setupFor(full, "vscode").snippets[0].href, /^vscode:mcp\/install\?/);
    assert.equal(setupFor(full, "gemini").snippets[0].text, "gemini extensions install https://github.com/arfct/menagerie");
  });

  it("tells Muse about the MCP server, the OpenAPI document, and the credential name", () => {
    const labels = setupFor(full, "muse").snippets.map((s) => s.label);
    assert.deepEqual(labels, [
      "MCP server (Muse builds the bridge and signs in)",
      "Or the OpenAPI document",
      "Base URL",
      "Credential name for a personal token",
      "Muse Code: the skill",
    ]);
    assert.equal(setupFor(full, "muse").snippets[3].text, "MENAGERIE_TOKEN");
  });

  it("falls back to the API for MCP-only hosts when the product has no MCP server", () => {
    const s = setupFor(apiOnly, "claude");
    assert.match(s.intro, /no MCP server/);
    assert.deepEqual(
      s.snippets.map((x) => x.label),
      ["REST API", "OpenAPI document"],
    );
    assert.equal(
      setupFor(apiOnly, "other").snippets.some((x) => x.label === "MCP configuration"),
      false,
    );
  });

  it("uses the anonymous endpoint when asked and the product has one", () => {
    const anon = setupFor(mcpOnly, "chatgpt", { anonymous: true });
    assert.equal(anon.snippets[0].text, "https://vapor.fyi/mcp/anonymous");
    assert.match(anon.intro, /no authentication/);
    const signed = setupFor(mcpOnly, "chatgpt");
    assert.equal(signed.snippets[0].text, "https://vapor.fyi/mcp");
    // No anonymous endpoint: the flag changes nothing.
    assert.equal(setupFor(full, "chatgpt", { anonymous: true }).snippets[0].text, "https://menagerie.fyi/mcp");
  });

  it("omits the plugin line without a marketplace and the extension line without a source", () => {
    assert.equal(setupFor(mcpOnly, "claude").snippets.length, 2);
    assert.equal(setupFor({ ...mcpOnly, source: null }, "gemini").snippets.length, 1);
  });
});

describe("hostForClientName", () => {
  it("recognises the hosts from clientInfo.name and falls back to other", () => {
    assert.equal(hostForClientName("claude-code"), "claude");
    assert.equal(hostForClientName("codex-cli"), "chatgpt");
    assert.equal(hostForClientName("Visual Studio Code"), "vscode");
    assert.equal(hostForClientName("Muse Code"), "muse");
    assert.equal(hostForClientName(""), "other");
    assert.equal(hostForClientName(null), "other");
    assert.equal(hostForClientName("lmstudio"), "other");
  });
});

describe("guide", () => {
  it("writes markdown with one section per host and the product's endpoints up top", () => {
    const md = guideMarkdown(full, { summary: "Keep things." });
    assert.match(md, /^# Menagerie for agents\n\nKeep things\./);
    assert.match(md, /- MCP server: https:\/\/menagerie\.fyi\/mcp/);
    assert.match(
      md,
      /- REST API: https:\/\/menagerie\.fyi\/api, described by https:\/\/menagerie\.fyi\/openapi\.yaml; a personal token from https:\/\/menagerie\.fyi\/settings is the bearer/,
    );
    for (const h of HOSTS) assert.ok(md.includes(`\n## ${h.label}\n`), h.label);
    assert.ok(md.includes("```\nclaude mcp add --transport http menagerie https://menagerie.fyi/mcp\n```"));
  });

  it("escapes everything in the HTML and keeps the structure", () => {
    const html = guideHtml({ ...full, name: "A <b>name</b>" });
    assert.ok(html.includes("<title>A &lt;b&gt;name&lt;/b&gt; for agents</title>"));
    assert.ok(!html.includes("<b>name</b>"));
    assert.ok(html.includes("<h2>Claude</h2>"));
    assert.ok(html.includes("<pre>\nclaude mcp add"));
    assert.ok(html.includes("<ul>\n<li>MCP server:"));
  });
});

describe("buildSubmission", () => {
  const tools = [
    { name: "get_me", description: "The signed-in person", scope: "read", annotations: { readOnlyHint: true } },
    { name: "resolve", description: "Turn input into candidates", scope: "read", annotations: { readOnlyHint: false, openWorldHint: true } },
    { name: "delete_list", description: "Delete a list.", scope: "write", annotations: { destructiveHint: true } },
  ];
  const app_info = { display_name: "X", subtitle: "s", description: "d", category: "PRODUCTIVITY" };

  it("derives per-tool justifications from annotations and lets the product override them", () => {
    const sub = buildSubmission({
      app_info,
      tools,
      justifications: { delete_list: { destructive_justification: "Confirmed first." } },
      test_cases: [{ description: "c", user_prompt: "p", tools_triggered: "get_me, resolve", expected_output: "o" }],
    });
    assert.equal(sub.schema_version, 1);
    assert.deepEqual(Object.keys(sub.tools), ["get_me", "resolve", "delete_list"]);
    assert.deepEqual(sub.tools.get_me.annotations, { readOnlyHint: true, openWorldHint: false, destructiveHint: false });
    assert.equal(sub.tools.get_me.justifications.read_only_justification, "Reads the signed-in person; it writes nothing.");
    assert.match(sub.tools.resolve.justifications.open_world_justification, /public URL/);
    assert.equal(sub.tools.delete_list.justifications.destructive_justification, "Confirmed first.");
    assert.match(sub.tools.delete_list.justifications.read_only_justification, /within the write scope/);
    assert.deepEqual(sub.test_cases[0].file_attachment_urls, null);
    assert.deepEqual(sub.negative_test_cases, []);
  });

  it("refuses a test case that names a tool the server does not have", () => {
    assert.throws(
      () => buildSubmission({ app_info, tools, test_cases: [{ description: "c", user_prompt: "p", tools_triggered: "nope", expected_output: "o" }] }),
      /unknown tool nope/,
    );
  });
});
