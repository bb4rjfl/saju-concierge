import { buildChoiceFooter, type Choice } from "./footer.js";
import { renderMarkdown, textResult } from "./markdown.js";
import { DISCLAIMER } from "./constants.js";
import type { ToolResult } from "../tools/types.js";

/**
 * Standard success response: body + optional share card + entertainment-tone
 * disclaimer + choice chips, all 24k-guarded. The share card, disclaimer and
 * chips go in the protected footer so they always survive truncation.
 */
export function ok(body: string, choices: Choice[], share?: string): ToolResult {
  const footerParts: string[] = [];
  if (share) footerParts.push(share.trim());
  footerParts.push(DISCLAIMER);
  footerParts.push(buildChoiceFooter(choices));
  return textResult(renderMarkdown(body, footerParts.join("\n\n")));
}

/** User-friendly error response with a retry-oriented footer (Korean). */
export function fail(title: string, detail: string, choices: Choice[]): ToolResult {
  const body = `⚠️ **${title}**\n\n${detail}`;
  return textResult(renderMarkdown(body, buildChoiceFooter(choices)));
}

/**
 * Shown when the optional keyless enrichment (weather/air) is momentarily
 * unavailable. Never blocks the fortune — the core saju reading still renders;
 * this is only for the rare path where a tool is *entirely* about that source.
 */
export function notConnected(toolTitle: string, sourceNote: string, choices: Choice[]): ToolResult {
  const body =
    `🔌 **${toolTitle} — 일시적으로 정보를 불러오지 못했어요**\n\n` +
    `${sourceNote}\n\n` +
    `_잠시 후 다시 시도해 주세요._`;
  return textResult(renderMarkdown(body, buildChoiceFooter(choices)));
}
