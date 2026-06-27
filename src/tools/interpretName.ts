import { z } from "zod";
import type { ToolDef } from "./types.js";
import { ok, fail } from "../lib/responses.js";
import type { Choice } from "../lib/footer.js";
import { buildShareCard } from "../lib/share.js";
import { SERVICE_NAME } from "../lib/constants.js";
import { readName, type NameReading } from "../engine/name.js";
import { OHAENG } from "../data/ohaeng.js";
import type { Element } from "../engine/elements.js";

const shape = {
  name: z.string().optional().describe("Korean name to interpret (e.g. '김민수'). Hangul syllables are read for their sound-element."),
  hanja: z.string().optional().describe("Optional Hanja for the name (currently the reading is based on the Hangul sound-element)."),
};

const CHOICES: Choice[] = [
  { emoji: "🌅", cmd: "오늘의 기운", desc: "오늘 운세 보기" },
  { emoji: "🧬", cmd: "성향 분석", desc: "내 사주 유형 보기" },
  { emoji: "💞", cmd: "궁합 보기", desc: "상대와 궁합 보기" },
];

function elBadge(e: Element): string {
  return `${OHAENG[e].emoji}${e}`;
}

function renderName(r: NameReading): string {
  const sylLine = r.syllables
    .map((s) => (s.element ? `**${s.ch}** ${elBadge(s.element)}` : `**${s.ch}** (–)`))
    .join("  ·  ");

  const present = (["목", "화", "토", "금", "수"] as Element[]).filter((e) => r.counts[e] > 0);
  const compo = present.map((e) => `${elBadge(e)} ${"●".repeat(r.counts[e])}`).join("  ");

  const impression = r.dominant.length
    ? r.dominant.map((e) => OHAENG[e].personality).join(", ")
    : "골고루 퍼진 기운";

  const lackLine =
    r.lacking.length > 0 && r.lacking.length < 5
      ? `\n🍀 **보완하면 좋은 기운**: ${r.lacking.map(elBadge).join("·")} — 예: ${OHAENG[r.lacking[0]!].color} 소품, ${OHAENG[r.lacking[0]!].food}`
      : "";

  return [
    `# 🔤 이름풀이 — ${r.name}`,
    `🔡 **음절 오행**: ${sylLine}`,
    "",
    `🎨 **오행 구성**: ${compo}`,
    `🌊 **이름의 결**: ${r.flowLabel}`,
    `✨ **인상**: ${impression} 느낌의 이름이에요` + lackLine,
  ].join("\n");
}

export const interpretName: ToolDef = {
  name: "interpretName",
  description:
    "Interprets a Korean name by mapping each syllable's initial consonant to its Five-Element (한글 음 오행: 아ㄱㅋ=Wood, 설ㄴㄷㄹㅌ=Fire, 순ㅁㅂㅍ=Water, 치ㅅㅈㅊ=Metal, 후ㅇㅎ=Earth), then reading the element flow (생/극) and balance with simple self-contained rules — a fun take on the name's vibe and which element it leans on. Entertainment-only, not professional naming advice. From " +
    SERVICE_NAME +
    ".",
  inputSchema: shape,
  annotations: {
    title: "Interpret Name",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: (args) => {
    const a = z.object(shape).parse(args);
    const raw = (a.name ?? "").trim();

    const reading = raw ? readName(raw) : null;
    if (!reading || reading.syllables.every((s) => s.element === null)) {
      return fail(
        "한글 이름이 필요해요",
        "예: `김민수` 처럼 한글 이름을 알려주세요. 음(音) 오행으로 이름의 결을 풀어드려요.",
        CHOICES,
      );
    }

    const share = buildShareCard({
      emoji: "🔤",
      title: `이름풀이 · ${reading.name}`,
      lines: [
        `🌊 ${reading.flowLabel}`,
        `🎨 대표 기운: ${reading.dominant.map(elBadge).join("·") || "고른 기운"}`,
      ],
      tryPhrase: "내 이름 풀이해줘",
    });

    return ok(renderName(reading), CHOICES, share);
  },
};
