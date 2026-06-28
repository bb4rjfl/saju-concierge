import { z } from "zod";
import type { ToolDef } from "./types.js";
import { ok, fail } from "../lib/responses.js";
import type { Choice } from "../lib/footer.js";
import { buildShareCard } from "../lib/share.js";
import { SERVICE_NAME } from "../lib/constants.js";
import { birthShape, resolveChart, BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL } from "./_shared.js";
import { computeAuspiciousDates, type AuspiciousResult } from "../engine/auspicious.js";
import { koreaToday } from "../engine/daily.js";
import { encodeProfile } from "../engine/profile.js";
import type { Chart } from "../engine/chart.js";

const shape = {
  ...birthShape,
  purpose: z
    .string()
    .optional()
    .describe("What the date is for: free text like '이사'(move), '결혼'(wedding), '개업'/'계약'(opening/contract), '여행'(travel), '시험'(exam). Default: general good days."),
  searchMonth: z
    .string()
    .optional()
    .describe("Optional 'YYYY-MM' to search within that month (distinct from the birth 'month' field). Default: the next ~60 days from today (KST)."),
  count: z.coerce.number().optional().describe("How many top dates to return (1–7, default 3)."),
};

const CHOICES: Choice[] = [
  { emoji: "🌅", cmd: "오늘의 기운", desc: "오늘 운세 보기" },
  { emoji: "💞", cmd: "궁합 보기", desc: "상대와 궁합 보기" },
  { emoji: "🔮", cmd: "명식 보기", desc: "내 사주 명식 보기" },
];

function addDays(t: { year: number; month: number; day: number }, n: number) {
  const dt = new Date(Date.UTC(t.year, t.month - 1, t.day));
  dt.setUTCDate(dt.getUTCDate() + n);
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

function parseMonth(s?: string): { from: { year: number; month: number; day: number }; to: { year: number; month: number; day: number }; label: string } | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: { year, month, day: 1 }, to: { year, month, day: last }, label: `${year}년 ${month}월` };
}

function renderDates(chart: Chart, periodLabel: string, r: AuspiciousResult): string {
  const titleLabel = r.purposeLabel === "좋은 날" ? "운수 좋은 날" : `${r.purposeLabel} 좋은 날`;
  const head = [
    `# 🗓️ ${titleLabel} (Top ${r.days.length})`,
    `**${periodLabel}** · ${chart.animal}띠 · 일간 ${chart.dayMaster.stem}(${chart.dayMaster.element}) 기준`,
    "",
  ];

  const items = r.days.map((d, i) => {
    const son = d.sonEopsNeunNal ? " · 🌟손 없는 날" : "";
    const reasons = d.reasons.length ? `\n   ↳ ${d.reasons.join(" · ")}` : "";
    return `**${i + 1}. ${d.date.month}월 ${d.date.day}일 (${d.weekday}) — ${d.dayGanji}일** · ${d.score}점${son}${reasons}`;
  });

  return [
    ...head,
    items.join("\n\n"),
    "",
    "_내 사주와 부딪히는(충) 날을 피하고, 손 없는 날·나를 돕는 기운 위주로 골랐어요._",
    "",
    `🔑 **내 사주 코드**: \`${encodeProfile(chart.profile)}\``,
  ].join("\n");
}

export const findAuspiciousDate: ToolDef = {
  name: "findAuspiciousDate",
  description:
    "Finds personally auspicious dates for an event (moving, wedding, opening/contract, travel, starting something) by scoring each day against the person's Saju chart — avoiding branch clashes (충) with their day/year pillar, favoring supportive elements, and flagging 손 없는 날 (lunar days ending in 9 or 0) — within the next ~60 days or a given month. A handy companion to the daily features. Entertainment-only, not a deterministic guarantee. From " +
    SERVICE_NAME +
    ".",
  inputSchema: shape,
  annotations: {
    title: "Find Auspicious Date",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false, // default range depends on today
    openWorldHint: false,
  },
  handler: (args) => {
    let chart: Chart | null;
    try {
      chart = resolveChart(args);
    } catch (err) {
      return fail(
        "택일을 계산하지 못했어요",
        `${(err as Error).message}. 1900~2050년 사이 날짜인지 확인해 주세요.`,
        CHOICES,
      );
    }
    if (!chart) {
      return fail(BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL, CHOICES);
    }

    const parsed = z.object(shape).parse(args);
    const today = koreaToday();
    const parsedMonth = parseMonth(parsed.searchMonth);
    const badMonth = parsed.searchMonth !== undefined && parsedMonth === null;
    const range = parsedMonth ?? {
      from: addDays(today, 1),
      to: addDays(today, 60),
      label: "앞으로 약 60일",
    };
    const count = Number.isFinite(parsed.count) ? Math.trunc(parsed.count as number) : 3;

    let result: AuspiciousResult;
    try {
      result = computeAuspiciousDates(chart, parsed.purpose, range.from, range.to, count);
    } catch (err) {
      return fail(
        "택일을 계산하지 못했어요",
        `${(err as Error).message}. 기간은 1900~2050년 사이로 알려주세요.`,
        CHOICES,
      );
    }

    if (result.days.length === 0) {
      return fail(
        "그 기간에서 날짜를 찾지 못했어요",
        "기간(예: `2026-08`)이 1900~2050년 사이인지 확인하거나, 다른 달로 알려주세요.",
        CHOICES,
      );
    }

    const top = result.days[0]!;
    const share = buildShareCard({
      emoji: "🗓️",
      title: result.purposeLabel === "좋은 날" ? "운수 좋은 날" : `${result.purposeLabel} 좋은 날`,
      lines: [
        `🥇 ${top.date.month}월 ${top.date.day}일 (${top.weekday}) ${top.dayGanji}일${top.sonEopsNeunNal ? " 🌟손없는날" : ""}`,
        `내 사주 기준 ${top.score}점`,
      ],
      tryPhrase: "이사 좋은 날 찾아줘",
    });

    const note = badMonth ? "_입력한 달을 못 읽어 '앞으로 약 60일' 기준으로 보여드려요(YYYY-MM)._\n\n" : "";
    return ok(note + renderDates(chart, range.label, result), CHOICES, share);
  },
};
