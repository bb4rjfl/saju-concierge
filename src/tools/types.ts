import type { ZodRawShape } from "zod";

/**
 * MCP tool annotations — all 5 hints are REQUIRED by Kakao review (§3-2).
 * No optional fields here on purpose: a tool that omits one won't compile.
 *
 * idempotentHint guide (docs/03, docs/09 §6):
 *  - true  : same input always → same output (computeSajuChart, analyzePersonality,
 *            interpretName, getYearlyFortune with a fixed targetYear)
 *  - false : result varies by time/RNG (getTodayFortune = depends on today's date)
 * openWorldHint:
 *  - false : pure local computation/curated data (default for Saju)
 *  - true  : touches the outside world (getTodayFortune only when it fetches the
 *            optional keyless weather/air enrichment)
 */
export interface ToolAnnotations {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export interface ToolResult {
  content: { type: "text"; text: string }[];
  /** Allows the SDK's CallToolResult structural match (extra fields like isError). */
  [key: string]: unknown;
}

/**
 * A registered tool. `inputSchema` is a Zod raw shape (the SDK converts it to
 * JSON Schema). `description` must be English, ≤1024 chars, and include the
 * service name — enforced by tests, not types.
 */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: ZodRawShape;
  annotations: ToolAnnotations;
  handler: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
}
