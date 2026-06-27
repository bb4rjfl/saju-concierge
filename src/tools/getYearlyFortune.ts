import { z } from "zod";
import type { ToolDef } from "./types.js";
import { ok, fail } from "../lib/responses.js";
import type { Choice } from "../lib/footer.js";
import { buildShareCard } from "../lib/share.js";
import { SERVICE_NAME } from "../lib/constants.js";
import { birthShape, resolveChart, BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL } from "./_shared.js";
import { computeYearlyFortune, type YearlyFortune } from "../engine/yearly.js";
import { koreaToday } from "../engine/daily.js";
import { encodeProfile } from "../engine/profile.js";
import { OHAENG } from "../data/ohaeng.js";
import type { Chart } from "../engine/chart.js";

const shape = {
  ...birthShape,
  targetYear: z.coerce
    .number()
    .optional()
    .describe("Year to read (e.g. 2026). Default = current year (KST). 1900–2050."),
};

const CHOICES: Choice[] = [
  { emoji: "🌅", cmd: "오늘의 기운", desc: "오늘 운세 보기" },
  { emoji: "🧬", cmd: "성향 분석", desc: "내 사주 유형 보기" },
  { emoji: "💞", cmd: "궁합 보기", desc: "상대와 궁합 보기" },
];

function starBar(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function renderYear(chart: Chart, y: YearlyFortune): string {
  const oh = OHAENG[y.favorableElement];
  const seasons = y.seasons.map((s) => `- ${s.line}`).join("\n");

  return [
    `# 📅 ${y.year}년 운세 (${y.yearGanji}년)`,
    `**${chart.animal}띠** · 일간 **${chart.dayMaster.stem}(${chart.dayMaster.element})** 님`,
    "",
    `**올해 운세 ${starBar(y.stars)} (${y.score}점)**`,
    `> ${y.headline}`,
    "",
    y.overview,
    "",
    "🗓️ **분기 흐름**",
    seasons,
    "",
    `🔑 **올해 키워드**: ${y.keywords.join(" · ")}`,
    `🍀 **행운의 기운**: ${y.favorableElement}(${oh.color})`,
    "",
    `🔑 **내 사주 코드**: \`${encodeProfile(chart.profile)}\``,
  ].join("\n");
}

export const getYearlyFortune: ToolDef = {
  name: "getYearlyFortune",
  description:
    "Outlines the fortune flow for a given year (default this year, KST) by reading that year's heavenly stem (세운) against the person's day master and Five-Element balance — an overall score, a year headline, three keywords, and spring/summer/fall/winter notes. Accepts a reusable profile code so no re-entry is needed and supports an 'unknown birth time' mode. Entertainment-only. From " +
    SERVICE_NAME +
    ".",
  inputSchema: shape,
  annotations: {
    title: "Get Yearly Fortune",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false, // default = current year (changes over time)
    openWorldHint: false,
  },
  handler: (args) => {
    let chart: Chart | null;
    try {
      chart = resolveChart(args);
    } catch (err) {
      return fail(
        "운세를 계산하지 못했어요",
        `${(err as Error).message}. 1900~2050년 사이 날짜인지, 양력/음력 여부를 확인해 주세요.`,
        CHOICES,
      );
    }
    if (!chart) {
      return fail(BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL, CHOICES);
    }

    const parsed = z.object(shape).parse(args);
    const year = Math.trunc(Number.isFinite(parsed.targetYear) ? (parsed.targetYear as number) : koreaToday().year);

    let yf: YearlyFortune;
    try {
      yf = computeYearlyFortune(chart, year);
    } catch (err) {
      return fail(
        "그 해의 운세를 계산하지 못했어요",
        `${(err as Error).message}. 연도는 1900~2050년 사이로 알려주세요.`,
        CHOICES,
      );
    }

    const share = buildShareCard({
      emoji: "📅",
      title: `${yf.year}년 운세`,
      lines: [`${starBar(yf.stars)} ${yf.score}점 — ${yf.headline}`, `🔑 ${yf.keywords.join(" · ")}`],
      tryPhrase: "올해 내 운세 봐줘",
    });
    return ok(renderYear(chart, yf), CHOICES, share);
  },
};
