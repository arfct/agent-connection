// A ChatGPT app submission (the Apps SDK portal's JSON) from the tool list
// an MCP server already serves, so the two cannot drift. The hand-written
// half (app_info, test cases, per-tool justification overrides) comes from
// the product; everything per tool is derived from its annotations.

/** @typedef {import("./chatgpt.d.ts").SubmissionTool} SubmissionTool */
/** @typedef {import("./chatgpt.d.ts").SubmissionInput} SubmissionInput */

export const SUBMISSION_SCHEMA = "https://developers.openai.com/apps-sdk/schemas/chatgpt-app-submission.v1.json";

/**
 * @param {SubmissionTool} t
 * @param {Partial<Record<"read_only_justification" | "open_world_justification" | "destructive_justification", string>>} over
 */
function justify(t, over) {
  const a = t.annotations;
  const first = (t.description ?? "").split("\n")[0].replace(/\.$/, "");
  return {
    read_only_justification:
      over.read_only_justification ??
      (a.readOnlyHint
        ? `Reads ${first.toLowerCase() || "the person's own data"}; it writes nothing.`
        : `Writes on the person's behalf${t.scope ? ` within the ${t.scope} scope they granted at consent` : ""}; every change is labeled with the client's name and can be revoked.`),
    open_world_justification:
      over.open_world_justification ??
      (a.openWorldHint
        ? "Fetches a public URL the person supplied."
        : "Talks only to the product's own API for the signed-in person; it reaches no other service."),
    destructive_justification:
      over.destructive_justification ??
      (a.destructiveHint
        ? "Removes or changes the person's own data in a way the server confirms with them first when it is shared or cannot be undone."
        : "Creates or updates the person's own records; nothing is deleted."),
  };
}

/**
 * @param {SubmissionInput} input
 */
export function buildSubmission(input) {
  const names = new Set(input.tools.map((t) => t.name));
  const cases = (list) =>
    (list ?? []).map((c) => {
      for (const name of (c.tools_triggered ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)) {
        if (!names.has(name)) throw new Error(`test case "${c.description}" names an unknown tool ${name}`);
      }
      return { ...c, file_attachment_urls: c.file_attachment_urls ?? null, expected_output_url: c.expected_output_url ?? null };
    });
  return {
    $schema: SUBMISSION_SCHEMA,
    schema_version: 1,
    app_info: input.app_info,
    tools: Object.fromEntries(
      input.tools.map((t) => [
        t.name,
        {
          annotations: {
            readOnlyHint: Boolean(t.annotations.readOnlyHint),
            openWorldHint: Boolean(t.annotations.openWorldHint),
            destructiveHint: Boolean(t.annotations.destructiveHint),
          },
          justifications: justify(t, input.justifications?.[t.name] ?? {}),
        },
      ]),
    ),
    test_cases: cases(input.test_cases),
    negative_test_cases: cases(input.negative_test_cases),
  };
}
