/** What a product exposes. Only `name`, `slug`, and `origin` are required; `mcp` defaults to `${origin}/mcp` and `null` means the product has no MCP server. */
export interface Product {
  /** Shown to people: "Menagerie". */
  name: string;
  /** Used in commands and config keys: "menagerie". */
  slug: string;
  origin: string;
  mcp?: string | null;
  /** A tokenless MCP endpoint, when the product offers one. */
  anonymousMcp?: string | null;
  /** The REST API base URL, for hosts without MCP. */
  api?: string | null;
  openapi?: string | null;
  /** The Agent Skills file. */
  skill?: string | null;
  /** Where personal tokens are made. */
  settings?: string | null;
  /** The repo, which doubles as a Gemini extension source. */
  source?: string | null;
  /** A Claude Code marketplace, "owner/repo". */
  marketplace?: string | null;
  /** The credential name a host stores a personal token under; defaults to SLUG_TOKEN. */
  tokenName?: string | null;
}

export type HostId = "claude" | "chatgpt" | "gemini" | "cursor" | "vscode" | "muse" | "other";

export interface Host {
  id: HostId;
  label: string;
  /** Reaches the product by MCP; false means it takes the REST API with a token. */
  mcp: boolean;
}

export interface Snippet {
  label: string;
  text: string;
  /** A link that does the same in one click. */
  href?: string;
}

export interface Setup {
  intro: string;
  snippets: Snippet[];
  note?: string;
}

export interface Endpoints {
  origin: string;
  mcp: string | null;
  anonymousMcp: string | null;
  api: string | null;
  openapi: string | null;
  skill: string | null;
  settings: string | null;
  source: string | null;
  marketplace: string | null;
  tokenName: string;
}

export const HOSTS: Host[];
export const CHATGPT_CONNECTORS_URL: string;
export function hostById(id: string): Host;
export function hostForClientName(clientName: string | null | undefined): HostId;
export function endpoints(p: Product): Endpoints;
export function setupFor(p: Product, host: HostId, opts?: { anonymous?: boolean }): Setup;
export function claudeConnectorLink(name: string, mcpUrl: string): string;
export function cursorInstallLink(slug: string, mcpUrl: string): string;
export function vscodeInstallLink(slug: string, mcpUrl: string): string;
export function guideMarkdown(p: Product, opts?: { summary?: string; anonymous?: boolean }): string;
export function guideHtml(p: Product, opts?: { summary?: string; anonymous?: boolean; css?: string }): string;
export function escapeHtml(s: string): string;
