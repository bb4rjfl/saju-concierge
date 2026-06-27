import type { ToolDef } from "./types.js";
import { ok, fail } from "../lib/responses.js";
import type { Choice } from "../lib/footer.js";
import { buildShareCard } from "../lib/share.js";
import { SERVICE_NAME } from "../lib/constants.js";
import { birthShape, resolveChart, BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL } from "./_shared.js";
import { computeSajuType, type SajuTypeResult } from "../engine/personality.js";
import { encodeProfile } from "../engine/profile.js";
import type { Chart } from "../engine/chart.js";
import type { GodCategory } from "../engine/elements.js";

const CHOICES: Choice[] = [
  { emoji: "🌅", cmd: "오늘의 기운", desc: "이 사주로 오늘 운세 보기" },
  { emoji: "💞", cmd: "궁합 보기", desc: "상대와 사주 유형 궁합" },
  { emoji: "🔮", cmd: "명식 보기", desc: "내 사주 명식 자세히" },
];

const CATEGORY_BLURB: Record<GodCategory, string> = {
  비겁: "자립·주관·승부",
  식상: "표현·창의·여유",
  재성: "현실·수완·실리",
  관성: "책임·원칙·관리",
  인성: "학습·배려·인덕",
};

function renderType(chart: Chart, t: SajuTypeResult): string {
  const dm = chart.dayMaster;

  const axes = t.axes.map((a) => `- **${a.key}** ${a.label} — ${a.desc}`).join("\n");

  // 두드러진 기운 top 2 (동률이면 순서대로)
  const top = (Object.entries(t.categories) as [GodCategory, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => `${cat}(${CATEGORY_BLURB[cat]})`)
    .join(", ");

  const code = encodeProfile(chart.profile);
  const timeNote = chart.isTimeUnknown
    ? "\n> ⏰ 시 모름 모드예요. 태어난 시각을 알면 유형이 더 정확해져요."
    : "";

  return [
    `# 🧬 내 사주 유형: ${t.info.emoji} ${t.info.name}`,
    `\`${t.code}\` · ${t.info.tagline}`,
    `_(${chart.animal}띠 · 일간 ${dm.stem}${dm.hanja}·${dm.element})_`,
    "",
    "**4가지 축**",
    axes,
    "",
    `**강점** — ${t.info.strengths}`,
    `**주의** — ${t.info.cautions}`,
    `**어울리는 분야** — ${t.info.fields}`,
    "",
    top ? `**두드러진 기운**: ${top}` : "",
    timeNote,
    "",
    `🔑 **내 사주 코드**: \`${code}\``,
    "_'궁합 보기'에 상대 코드와 함께 넣으면 유형 궁합도 볼 수 있어요._",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export const analyzePersonality: ToolDef = {
  name: "analyzePersonality",
  description:
    "Summarizes a person's innate tendencies as a shareable 'Saju type' — a four-axis code and a named archetype (one of 16) derived from the Ten Gods (십신) and Five-Element (오행) balance of their chart — with strengths, cautions, and well-suited fields. Accepts a reusable profile code so no re-entry is needed and supports an 'unknown birth time' mode. Entertainment-only, supportive tone. From " +
    SERVICE_NAME +
    ".",
  inputSchema: birthShape,
  annotations: {
    title: "Analyze Personality (Saju Type)",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true, // same chart → same type
    openWorldHint: false,
  },
  handler: (args) => {
    let chart: Chart | null;
    try {
      chart = resolveChart(args);
    } catch (err) {
      return fail(
        "사주 유형을 계산하지 못했어요",
        `${(err as Error).message}. 1900~2050년 사이 날짜인지, 양력/음력 여부를 확인해 주세요.`,
        CHOICES,
      );
    }
    if (!chart) {
      return fail(BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL, CHOICES);
    }

    const t = computeSajuType(chart);
    const share = buildShareCard({
      emoji: t.info.emoji,
      title: `내 사주 유형 · ${t.info.name}`,
      lines: [`\`${t.code}\` ${t.info.tagline}`, `💪 ${t.info.strengths}`],
      tryPhrase: "내 사주 유형 알려줘",
    });
    return ok(renderType(chart, t), CHOICES, share);
  },
};
