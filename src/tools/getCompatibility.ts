import { z } from "zod";
import type { ToolDef } from "./types.js";
import { ok, fail } from "../lib/responses.js";
import type { Choice } from "../lib/footer.js";
import { buildShareCard } from "../lib/share.js";
import { SERVICE_NAME } from "../lib/constants.js";
import { birthShape, resolveChart } from "./_shared.js";
import { encodeProfile } from "../engine/profile.js";
import { computeCompatibility, type Compatibility } from "../engine/compat.js";
import type { Chart } from "../engine/chart.js";

const personObject = z.object(birthShape);

const shape = {
  personA: personObject
    .optional()
    .describe("Person A (you). Either birth fields (year/month/day, optional hour…) or a profileCode ('SC1|…')."),
  personB: personObject
    .optional()
    .describe("Person B (partner/friend/colleague). Either birth fields or a profileCode ('SC1|…')."),
  relation: z
    .string()
    .optional()
    .describe("Relationship framing: free text like 'love'/'연인', 'friend'/'친구', 'work'/'동료'. Normalized internally."),
};

const CHOICES: Choice[] = [
  { emoji: "🌅", cmd: "오늘의 기운", desc: "내 오늘 운세 보기" },
  { emoji: "🧬", cmd: "성향 분석", desc: "내 사주 유형 보기" },
  { emoji: "💞", cmd: "다른 궁합 보기", desc: "다른 사람과 궁합" },
];

function hearts(n: number): string {
  return "♥".repeat(n) + "♡".repeat(5 - n);
}

function resolveOne(person: unknown): Chart | null {
  if (!person || typeof person !== "object") return null;
  return resolveChart(person as Record<string, unknown>);
}

function renderCard(a: Chart, b: Chart, c: Compatibility): string {
  const aDM = `${a.dayMaster.stem}(${a.dayMaster.element})`;
  const bDM = `${b.dayMaster.stem}(${b.dayMaster.element})`;

  return [
    "# 💞 궁합 카드",
    `**${a.animal}띠 ${aDM} ✕ ${b.animal}띠 ${bDM}** · ${c.relationLabel}`,
    "",
    `**궁합 ${hearts(c.hearts)} ${c.score}점**`,
    `> ${c.headline}`,
    `_${c.catchphrase}_`,
    "",
    "🔗 **두 사람의 케미**",
    `- 일간 ${a.dayMaster.element} ↔ ${b.dayMaster.element}: **${c.dmRelation}** — ${c.dmNote}`,
    `- 띠: **${c.branchRelation}** — ${c.branchNote}`,
    `- 기운 보완: ${c.complementNote}`,
    "",
    `💚 **강점** — ${c.strengths}`,
    `💛 **주의** — ${c.cautions}`,
    "",
    `🔑 코드 — 나 \`${encodeProfile(a.profile)}\` · 상대 \`${encodeProfile(b.profile)}\``,
    "_상대 코드를 저장해두면 다음에 바로 다시 볼 수 있어요._",
  ].join("\n");
}

export const getCompatibility: ToolDef = {
  name: "getCompatibility",
  description:
    "Compares two people's Saju charts — the day-master Five-Element relationship, Chinese-zodiac branch harmony/clash (삼합·육합·육충), and how well they fill each other's elemental gaps — to produce a fun, shareable compatibility card with a heart score, strengths, and cautions. Each person is given as birth fields or a reusable profile code; supports love/friend/work framing and an unknown birth time. Entertainment-only. From " +
    SERVICE_NAME +
    ".",
  inputSchema: shape,
  annotations: {
    title: "Get Compatibility",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true, // same two charts + relation → same card
    openWorldHint: false,
  },
  handler: (args) => {
    const a = z.object(shape).parse(args);

    let chartA: Chart | null;
    let chartB: Chart | null;
    try {
      chartA = resolveOne(a.personA);
      chartB = resolveOne(a.personB);
    } catch (err) {
      return fail(
        "궁합을 계산하지 못했어요",
        `${(err as Error).message}. 두 사람 모두 1900~2050년 사이 날짜인지, 양력/음력 여부를 확인해 주세요.`,
        CHOICES,
      );
    }

    if (!chartA && !chartB) {
      return fail(
        "두 사람의 생년월일이 필요해요",
        "예: 나 `1995-03-02`, 상대 `1996-07-21` 처럼 두 사람 정보를 알려주세요. 각자 사주 코드(`SC1|…`)가 있으면 그대로 넣어도 돼요. 연인/친구/동료 중 무엇인지 말해주면 더 맞춤이에요.",
        CHOICES,
      );
    }
    if (!chartB) {
      return fail(
        "상대방 생년월일이 필요해요",
        "상대의 생년월일(또는 사주 코드 `SC1|…`)을 알려주세요. 시각을 모르면 빼도 돼요.",
        CHOICES,
      );
    }
    if (!chartA) {
      return fail(
        "내 생년월일이 필요해요",
        "본인의 생년월일(또는 사주 코드 `SC1|…`)을 알려주세요. 시각을 모르면 빼도 돼요.",
        CHOICES,
      );
    }

    const compat = computeCompatibility(chartA, chartB, a.relation);
    const share = buildShareCard({
      emoji: "💞",
      title: `${compat.relationLabel} ${compat.score}점`,
      lines: [
        `${chartA.animal}띠 ✕ ${chartB.animal}띠`,
        `${"♥".repeat(compat.hearts)}${"♡".repeat(5 - compat.hearts)} ${compat.headline}`,
      ],
      tryPhrase: "나랑 친구 궁합 봐줘",
    });
    return ok(renderCard(chartA, chartB, compat), CHOICES, share);
  },
};
