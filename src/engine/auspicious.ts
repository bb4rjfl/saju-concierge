/**
 * 택일(좋은 날 찾기) — 개인 명식에 맞춘 길일 산출. (findAuspiciousDate 툴이 사용)
 *
 * "범용 달력 정보"가 아니라 **내 사주(일지·년지의 충 회피 + 일간을 돕는 오행 + 목적별 가중)**
 * 로 점수화 → "당신 사주에 맞는 날"이 고유가치(LLM 단독 불가). 손 없는 날(음력 끝자리 9·0)
 * 도 반영. 결정론적 순수 함수. ⚠️ 단정 금지("이 날 하면 잘 된다" ✕ → "전통적으로 길하게 보는 날" ○).
 */
import { solarToLunar } from "@fullstackfamily/manseryeok";
import type { Chart } from "./chart.js";
import { ELEMENTS, STEMS, categoryFor, type Element, type GodCategory } from "./elements.js";

export type PurposeKey = "move" | "wedding" | "business" | "travel" | "start" | "general";

const YUKCHUNG: [string, string][] = [
  ["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"],
];
const YUKHAP: [string, string][] = [
  ["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"],
];
const SAMHAP: string[][] = [
  ["신", "자", "진"], ["해", "묘", "미"], ["인", "오", "술"], ["사", "유", "축"],
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export interface AuspiciousDay {
  date: { year: number; month: number; day: number };
  weekday: string;
  dayGanji: string;
  lunarDay: number;
  sonEopsNeunNal: boolean;
  score: number;
  reasons: string[];
}

export interface AuspiciousResult {
  purposeKey: PurposeKey;
  purposeLabel: string;
  days: AuspiciousDay[];
  scanned: number;
}

function isChung(a: string, b: string): boolean {
  return YUKCHUNG.some((p) => p.includes(a) && p.includes(b)) && a !== b;
}
function isHap(a: string, b: string): boolean {
  if (a === b) return false;
  if (YUKHAP.some((p) => p.includes(a) && p.includes(b))) return true;
  return SAMHAP.some((g) => g.includes(a) && g.includes(b));
}
function generatorOf(el: Element): Element {
  return ELEMENTS[(ELEMENTS.indexOf(el) + 4) % 5]!;
}

export function normalizePurpose(raw?: string): { key: PurposeKey; label: string } {
  const s = (raw ?? "").toLowerCase();
  if (/이사|이전|입주|이삿/.test(s)) return { key: "move", label: "이사" };
  if (/결혼|혼인|예식|상견례|약혼|웨딩/.test(s)) return { key: "wedding", label: "결혼" };
  if (/개업|오픈|창업|사업|계약|거래|개점|이전개업/.test(s)) return { key: "business", label: "개업·계약" };
  if (/여행|출장|이동|여정/.test(s)) return { key: "travel", label: "여행" };
  if (/시험|면접|시작|발표|수술|입학/.test(s)) return { key: "start", label: "중요한 일 시작" };
  return { key: "general", label: "좋은 날" };
}

function scoreDay(
  chart: Chart,
  purpose: PurposeKey,
  dayGanji: string,
  lunarDay: number,
  weekdayIdx: number,
): { score: number; reasons: string[]; son: boolean } {
  const dayStem = dayGanji[0]!;
  const dayBranch = dayGanji[1]!;
  const stemEl = STEMS[dayStem]!.element;
  const myDayBranch = chart.pillars.day.branch;
  const myYearBranch = chart.pillars.year.branch;
  const reasons: string[] = [];
  let score = 60;

  const son = [9, 10, 19, 20, 29, 30].includes(lunarDay);
  if (son) {
    score += purpose === "move" ? 20 : 14;
    reasons.push("손 없는 날");
  }

  if (isChung(dayBranch, myDayBranch)) {
    score -= purpose === "wedding" ? 30 : 22;
    reasons.push("⚠️ 내 일지와 충(부딪힘) — 피하는 게 좋아요");
  } else if (isHap(dayBranch, myDayBranch)) {
    score += purpose === "wedding" ? 16 : 10;
    reasons.push("내 일지와 합(잘 맞음)");
  }
  if (isChung(dayBranch, myYearBranch)) {
    score -= 8;
    reasons.push("내 띠와 충");
  }

  // 일간을 돕는 오행이면 가점
  const favorable = chart.lacking[0] ?? generatorOf(chart.dayMaster.element);
  if (chart.lacking.includes(stemEl)) {
    score += 8;
    reasons.push(`부족한 ${stemEl} 기운을 채워주는 날`);
  } else if (stemEl === favorable) {
    score += 5;
    reasons.push(`나를 돕는 ${stemEl} 기운의 날`);
  }

  // 목적별 가중
  const cat: GodCategory = categoryFor(
    chart.dayMaster.element,
    chart.dayMaster.yinYang,
    stemEl,
    STEMS[dayStem]!.yinYang,
  );
  if (purpose === "business" && (cat === "재성" || cat === "식상")) {
    score += cat === "재성" ? 8 : 5;
    reasons.push(cat === "재성" ? "재물 기운(재성)의 날" : "활동 기운(식상)의 날");
  }
  if ((purpose === "wedding" || purpose === "business") && (weekdayIdx === 0 || weekdayIdx === 6)) {
    score += 3;
  }

  return { score: Math.max(0, Math.min(100, score)), reasons, son };
}

export function computeAuspiciousDates(
  chart: Chart,
  purposeRaw: string | undefined,
  from: { year: number; month: number; day: number },
  to: { year: number; month: number; day: number },
  count = 3,
): AuspiciousResult {
  const { key, label } = normalizePurpose(purposeRaw);
  const start = new Date(Date.UTC(from.year, from.month - 1, from.day));
  const end = new Date(Date.UTC(to.year, to.month - 1, to.day));

  const all: AuspiciousDay[] = [];
  let scanned = 0;
  for (let t = start; t <= end && scanned < 200; t.setUTCDate(t.getUTCDate() + 1)) {
    const year = t.getUTCFullYear();
    const month = t.getUTCMonth() + 1;
    const day = t.getUTCDate();
    const weekdayIdx = t.getUTCDay();
    scanned++;
    try {
      const r = solarToLunar(year, month, day);
      const dayGanji = r.gapja.dayPillar;
      const { score, reasons, son } = scoreDay(chart, key, dayGanji, r.lunar.day, weekdayIdx);
      all.push({
        date: { year, month, day },
        weekday: WEEKDAYS[weekdayIdx]!,
        dayGanji,
        lunarDay: r.lunar.day,
        sonEopsNeunNal: son,
        score,
        reasons,
      });
    } catch {
      // 지원 범위 밖/유효하지 않은 날짜는 건너뜀
    }
  }

  all.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // 동점이면 빠른 날짜 우선
    const da = a.date.year * 10000 + a.date.month * 100 + a.date.day;
    const db = b.date.year * 10000 + b.date.month * 100 + b.date.day;
    return da - db;
  });

  return { purposeKey: key, purposeLabel: label, days: all.slice(0, Math.max(1, Math.min(7, count))), scanned };
}
