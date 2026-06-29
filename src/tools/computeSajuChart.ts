import type { ToolDef } from "./types.js";
import { ok, fail } from "../lib/responses.js";
import type { Choice } from "../lib/footer.js";
import { buildShareCard } from "../lib/share.js";
import { SERVICE_NAME } from "../lib/constants.js";
import { birthShape, resolveChart, BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL } from "./_shared.js";
import { encodeProfile } from "../engine/profile.js";
import { ELEMENTS, type Element } from "../engine/elements.js";
import { OHAENG } from "../data/ohaeng.js";
import type { Chart } from "../engine/chart.js";

const CHOICES: Choice[] = [
  { emoji: "🌅", cmd: "오늘의 기운", desc: "이 사주 코드로 오늘 운세 보기" },
  { emoji: "🧬", cmd: "성향 분석", desc: "타고난 성향(사주 유형) 보기" },
  { emoji: "💞", cmd: "궁합 보기", desc: "상대 생년월일로 궁합 보기" },
];

const BAR_FULL = "●";

function renderElementBalance(chart: Chart): string {
  const order = [...ELEMENTS].sort((a, b) => {
    const d = chart.elementCounts[b] - chart.elementCounts[a];
    return d !== 0 ? d : ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b);
  });
  return order
    .map((e: Element) => {
      const n = chart.elementCounts[e];
      const bar = n > 0 ? BAR_FULL.repeat(n) : "·";
      const tag = n === 0 ? " ← 부족" : "";
      return `- ${OHAENG[e].emoji} ${e} ${bar} ${n}${tag}`;
    })
    .join("\n");
}

function renderChart(chart: Chart): string {
  const p = chart.pillars;
  const dm = chart.dayMaster;
  const prof = chart.profile;

  const dateLine =
    `**${prof.year}년 ${prof.month}월 ${prof.day}일 (양력)` +
    (chart.isTimeUnknown
      ? " · 시 모름**"
      : ` ${String(prof.hour).padStart(2, "0")}:${String(prof.minute ?? 0).padStart(2, "0")}생**`);

  const corrected =
    chart.timeCorrected && !chart.isTimeUnknown
      ? ` (진태양시 보정 ${String(chart.timeCorrected.hour).padStart(2, "0")}:${String(chart.timeCorrected.minute).padStart(2, "0")})`
      : "";

  const hourStem = p.hour ? `${p.hour.stem} ${p.hour.hanja[0]}` : "?";
  const hourBranch = p.hour ? `${p.hour.branch} ${p.hour.hanja[1]}` : "?";
  const hourName = p.hour ? p.hour.name : "시 모름";

  const pillarSummary =
    `📋 **년주** ${p.year.name} · **월주** ${p.month.name} · ` +
    `**일주** ${p.day.name} · **시주** ${hourName}`;

  const table = [
    "| 구분 | 년주 | 월주 | 일주 | 시주 |",
    "|---|---|---|---|---|",
    `| 천간 | ${p.year.stem} ${p.year.hanja[0]} | ${p.month.stem} ${p.month.hanja[0]} | **${p.day.stem} ${p.day.hanja[0]}** | ${hourStem} |`,
    `| 지지 | ${p.year.branch} ${p.year.hanja[1]} | ${p.month.branch} ${p.month.hanja[1]} | ${p.day.branch} ${p.day.hanja[1]} | ${hourBranch} |`,
  ].join("\n");

  const sipsinLine =
    chart.sipsin.length > 0 ? chart.sipsin.map((s) => `${s.position} ${s.sipsin}`).join(" · ") : "—";

  const withEmoji = (els: Element[]) => els.map((e) => `${OHAENG[e].emoji}${e}`).join("·");
  const balanceRead =
    `→ **${withEmoji(chart.dominant)}** 기운이 강하고` +
    (chart.lacking.length > 0
      ? `, **${withEmoji(chart.lacking)}** 기운이 비었어요.`
      : ", 비교적 고른 편이에요.");

  const code = encodeProfile(prof);

  const timeNote = chart.isTimeUnknown
    ? "\n\n> ⏰ 태어난 시각을 모르면 시주는 비우고 봐요(시 모름 모드). 시각을 알면 더 정밀해져요."
    : "";

  return [
    "# 🔮 명식 (사주팔자)",
    "",
    `${dateLine} · 일간 **${dm.stem}(${dm.hanja})·${dm.element}** · **${chart.animal}띠**${corrected}`,
    "",
    pillarSummary,
    "",
    table,
    "",
    "**오행 분포** — 균형이 운세 해석의 뼈대예요",
    renderElementBalance(chart),
    "",
    balanceRead,
    "",
    `**십신 한눈에**: ${sipsinLine}`,
    timeNote,
    "",
    `🔑 **내 사주 코드**: \`${code}\``,
    "_다음 기능에 이 코드를 그대로 넣으면 생년월일을 다시 입력하지 않아도 돼요._",
  ].join("\n");
}

export const computeSajuChart: ToolDef = {
  name: "computeSajuChart",
  description:
    "Computes the Saju Four Pillars (year/month/day/hour stems & branches), the day master (일간), the Chinese zodiac animal (띠), and the Five-Element (오행) distribution from a birth date/time using a Korean KASI-based manseryeok engine, then returns a compact reusable profile code so later tools need no re-entry. Supports lunar dates (음력/윤달) and an 'unknown birth time' (시 모름) mode. Entertainment-only. From " +
    SERVICE_NAME +
    ".",
  inputSchema: birthShape,
  annotations: {
    title: "Compute Saju Chart",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: (args) => {
    let chart: Chart | null;
    try {
      chart = resolveChart(args);
    } catch (err) {
      return fail(
        "명식을 계산하지 못했어요",
        `${(err as Error).message}. 양력/음력 여부와 1900~2050년 사이 날짜인지 확인해 주세요.`,
        CHOICES,
      );
    }

    if (!chart) {
      return fail(BIRTH_PROMPT_TITLE, BIRTH_PROMPT_DETAIL, CHOICES);
    }

    const share = buildShareCard({
      emoji: "🔮",
      title: "내 사주 명식",
      lines: [
        `${chart.animal}띠 · 일간 ${chart.dayMaster.stem}(${chart.dayMaster.element})`,
        `강한 기운 ${chart.dominant.join("·")}${chart.lacking.length ? ` · 약한 기운 ${chart.lacking.join("·")}` : ""}`,
      ],
      tryPhrase: "내 사주 명식 봐줘",
    });
    return ok(renderChart(chart), CHOICES, share);
  },
};
