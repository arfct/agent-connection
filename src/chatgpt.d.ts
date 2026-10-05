export interface SubmissionTool {
  name: string;
  description?: string;
  /** The OAuth scope the tool needs, named in the generated justification. */
  scope?: string | null;
  annotations: { readOnlyHint?: boolean; openWorldHint?: boolean; destructiveHint?: boolean };
}

export interface SubmissionCase {
  description: string;
  user_prompt: string;
  tools_triggered: string | null;
  expected_output: string;
  file_attachment_urls?: string[] | null;
  expected_output_url?: string | null;
}

export interface SubmissionInput {
  app_info: { display_name: string; subtitle: string; description: string; category: string };
  tools: SubmissionTool[];
  justifications?: Record<string, Partial<Record<"read_only_justification" | "open_world_justification" | "destructive_justification", string>>>;
  test_cases?: SubmissionCase[];
  negative_test_cases?: SubmissionCase[];
}

export const SUBMISSION_SCHEMA: string;
export function buildSubmission(input: SubmissionInput): {
  $schema: string;
  schema_version: 1;
  app_info: SubmissionInput["app_info"];
  tools: Record<
    string,
    {
      annotations: { readOnlyHint: boolean; openWorldHint: boolean; destructiveHint: boolean };
      justifications: Record<"read_only_justification" | "open_world_justification" | "destructive_justification", string>;
    }
  >;
  test_cases: Required<SubmissionCase>[];
  negative_test_cases: Required<SubmissionCase>[];
};
