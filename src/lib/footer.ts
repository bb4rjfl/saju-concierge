/**
 * "눌러서 이어가기" choice chips. Core UX (docs/04): every tool response ends
 * with 2–4 short chips the user can tap/echo to trigger the next tool call — the
 * stateless substitute for buttons. Korean-first (this service targets Korean
 * users), unlike the foreigner-facing 1st project.
 */

export interface Choice {
  emoji: string;
  /** Command phrase the user echoes (Korean). The LLM maps it to the next tool. */
  cmd: string;
  /** Short description of what the chip does. */
  desc: string;
}

/**
 * Build the standard Markdown footer. Enforces 2–4 chips (docs/04 rule); throws
 * otherwise so a malformed footer fails fast in tests rather than shipping.
 */
export function buildChoiceFooter(choices: Choice[]): string {
  if (choices.length < 2 || choices.length > 4) {
    throw new Error(`choice footer must have 2–4 chips, got ${choices.length}`);
  }

  const lines = choices.map((c) => `- ${c.emoji} \`${c.cmd}\` — ${c.desc}`);
  return ["---", "**눌러서 이어가기 👇**", ...lines].join("\n");
}
