import { z } from "zod";
import type { ToolDef } from "./types.js";
import { ok, fail } from "../lib/responses.js";
import type { Choice } from "../lib/footer.js";
import { buildShareCard } from "../lib/share.js";
import { fetchWeather, weatherLine } from "../lib/weather.js";
import { SERVICE_NAME } from "../lib/constants.js";
import { birthShape, resolveChart, BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL } from "./_shared.js";
import { computeDailyKit, koreaToday, type DailyKit } from "../engine/daily.js";
import { encodeProfile } from "../engine/profile.js";
import { OHAENG } from "../data/ohaeng.js";
import type { Chart } from "../engine/chart.js";

const shape = {
  ...birthShape,
  targetDate: z
    .string()
    .optional()
    .describe("Optional date 'YYYY-MM-DD' to read instead of today — e.g. tomorrow for a preview. Default = today (KST)."),
};

const CHOICES: Choice[] = [
  { emoji: "💞", cmd: "궁합 보기", desc: "상대 생년월일로 궁합" },
  { emoji: "🔮", cmd: "명식 보기", desc: "내 사주 명식 자세히" },
  { emoji: "🧬", cmd: "성향 분석", desc: "내 사주 유형(MBTI식)" },
  { emoji: "📆", cmd: "내일 운세", desc: "내일 기운 미리보기" },
];

function parseDate(s?: string): { year: number; month: number; day: number } | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const d = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;
  return d;
}

function starBar(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function renderKit(chart: Chart, kit: DailyKit, isToday: boolean, wx?: string): string {
  const dm = chart.dayMaster;
  const title = isToday
    ? `# 🌅 오늘의 기운 — ${kit.date.month}월 ${kit.date.day}일`
    : `# 🔮 ${kit.date.year}년 ${kit.date.month}월 ${kit.date.day}일의 기운`;

  const intro = `**${chart.animal}띠** · 일간 **${dm.stem}(${dm.element})** 님` + (chart.isTimeUnknown ? " · 시 모름" : "");

  const domainLines = kit.domains
    .map((d) => `- ${d.emoji} **${d.key}** ${d.score} · ${d.line}`)
    .join("\n");

  const lucky =
    `- 🎨 색 **${kit.lucky.color}** · 🔢 숫자 **${kit.lucky.numbers.join("·")}** · 🧭 방향 **${kit.lucky.direction}**\n` +
    `- 🍽️ 음식 **${kit.lucky.food}** · 🎁 아이템 **${kit.lucky.item}** · ⏰ 시간대 **${kit.lucky.time}**`;

  const dos = kit.dos.map((d) => `- ${d}`).join("\n");
  const donts = kit.donts.map((d) => `- ${d}`).join("\n");

  const code = encodeProfile(chart.profile);

  const favEmoji = OHAENG[kit.favorableElement].emoji;
  const aff = kit.affinity;
  const affLine =
    (aff.animals.length
      ? `🤝 **나와 잘 맞는 인연** — ${aff.animals.join("·")}띠 · ${OHAENG[aff.element].emoji}${aff.element} 기운의 사람`
      : `🤝 **나와 잘 맞는 인연** — ${OHAENG[aff.element].emoji}${aff.element} 기운의 사람`) + `\n- ${aff.note}`;

  const dailyNudge = isToday
    ? "\n💡 매일 아침 카톡으로 받고 싶다면, 에이전트에게 **\"매일 아침 8시에 오늘의 기운 보내줘\"** 라고 한 번만 설정해 보세요(지원 클라이언트 한정)."
    : "";

  const nextStep = `👉 **이어서 해볼까요?** \`궁합 보기\` · \`명식 보기\` · \`내일 운세\``;

  return [
    title,
    intro,
    ...(wx ? ["", wx] : []),
    "",
    `**오늘의 운세 ${starBar(kit.stars)} (${kit.score}점)**`,
    `> ${kit.headline} _(일진 ${kit.dayGanji} · ${kit.theme}의 기운)_`,
    "",
    "**키워드**",
    domainLines,
    "",
    `📝 **종합평** — ${kit.summary}`,
    "",
    `🍀 **오늘의 럭키** _(나에게 힘이 되는 ${favEmoji} ${kit.favorableElement} 기운)_`,
    lucky,
    "",
    "✅ **이렇게 해보세요**",
    dos,
    "",
    "🚫 **이건 잠깐 멈춰요**",
    donts,
    "",
    affLine,
    dailyNudge,
    "",
    nextStep,
    "",
    `🔑 **내 사주 코드**: \`${code}\``,
  ].join("\n");
}

export const getTodayFortune: ToolDef = {
  name: "getTodayFortune",
  description:
    "Reads a person's fortune for a given day (default today, KST) by comparing that day's pillar (일진) against their Saju chart's day master and Five-Element balance. Returns a fun daily kit: an overall score, love/money/work/health keywords, a lucky color/number/item/direction/food/time, and do/don't tips. Optionally adds live local weather and air quality (keyless) when a location is given. Accepts a reusable profile code so no re-entry is needed, supports an 'unknown birth time' mode, and is a clean single call an agent can schedule for a daily KakaoTalk delivery. Entertainment-only. From " +
    SERVICE_NAME +
    ".",
  inputSchema: shape,
  annotations: {
    title: "Get Today's Fortune",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false, // depends on the date
    openWorldHint: true, // optionally fetches keyless live weather/air when a location is given
  },
  handler: async (args) => {
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
    const today = koreaToday();
    const parsedTarget = parseDate(parsed.targetDate);
    const badDate = parsed.targetDate !== undefined && parsedTarget === null;
    const target = parsedTarget ?? today;
    const isToday = target.year === today.year && target.month === today.month && target.day === today.day;

    let kit: DailyKit;
    try {
      kit = computeDailyKit(chart, target, chart.profile.occupation);
    } catch (err) {
      return fail(
        "그 날짜의 운세를 계산하지 못했어요",
        `${(err as Error).message}. 날짜는 1900~2050년 사이로 알려주세요.`,
        CHOICES,
      );
    }

    // 날씨/대기질은 '오늘' 카드에서만. 과거·미래 날짜 카드에 현재 날씨를 "오늘"로 붙이면
    // 오해를 줄 수 있어 표시하지 않는다 (라이브 QA F-3).
    let wxLine: string | undefined;
    if (isToday && chart.profile.location) {
      const w = await fetchWeather(chart.profile.location);
      if (w) wxLine = weatherLine(w, chart.profile.location);
    }

    const short = kit.headline.length > 22 ? kit.headline.slice(0, 22) + "…" : kit.headline;
    const share = buildShareCard({
      emoji: "🌅",
      title: `오늘의 기운 ${kit.date.month}/${kit.date.day}`,
      lines: [`${"★".repeat(kit.stars)}${"☆".repeat(5 - kit.stars)} ${kit.score}점 — ${short}`, `🍀 럭키 ${kit.lucky.color} · ${kit.lucky.item}`],
      tryPhrase: "오늘 내 운세 봐줘",
    });
    const note = badDate ? "_입력한 날짜를 못 읽어 오늘 기준으로 보여드려요(YYYY-MM-DD)._\n\n" : "";
    return ok(note + renderKit(chart, kit, isToday, wxLine), CHOICES, share);
  },
};
