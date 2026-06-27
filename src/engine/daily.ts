/**
 * 데일리 럭키 키트 산출 — 오늘 일진(간지) vs 명식(일간) → 점수·키워드·럭키·do/don'ts.
 * (getTodayFortune 툴이 사용). 스케줄 친화: 같은 명식·같은 날짜면 항상 같은 결과(재현 가능),
 * 단 날짜가 바뀌면 결과가 바뀐다(idempotentHint:false).
 *
 * 모든 산출은 결정론적 순수 함수. 오늘 날짜는 호출부가 주입(koreaToday)해 테스트 가능.
 */
import { calculateSaju } from "@fullstackfamily/manseryeok";
import type { Chart } from "./chart.js";
import {
  ELEMENTS,
  STEMS,
  controls,
  categoryFor,
  type Element,
  type GodCategory,
} from "./elements.js";
import { OHAENG } from "../data/ohaeng.js";

export interface DailyDomain {
  key: string;
  emoji: string;
  score: number;
  line: string;
}

export interface DailyKit {
  date: { year: number; month: number; day: number };
  /** 오늘의 일진(간지) 한글, 예: "갑자". */
  dayGanji: string;
  theme: GodCategory;
  /** 38~98. */
  score: number;
  /** 1~5. */
  stars: number;
  headline: string;
  domains: DailyDomain[];
  lucky: {
    element: Element;
    color: string;
    numbers: number[];
    direction: string;
    item: string;
    food: string;
    time: string;
  };
  dos: string[];
  donts: string[];
  favorableElement: Element;
}

const BASE_SCORE: Record<GodCategory, number> = {
  인성: 72,
  식상: 70,
  재성: 67,
  비겁: 62,
  관성: 60,
};

const DOMAIN_EMOJI: Record<string, string> = { 애정: "💗", 재물: "💰", 일: "💼", 건강: "🌿" };

/** [상(≥75), 중(55~74), 하(<55)] 순. */
const DOMAIN_PHRASES: Record<string, [string, string, string]> = {
  애정: ["마음이 잘 통하는 하루예요", "먼저 다가가면 좋은 흐름", "오해 없게 한 박자 천천히"],
  재물: ["채워질 일이 더 많은 흐름", "큰 욕심만 빼면 무난해요", "지출 관리에 신경 쓰기 좋은 날"],
  일: ["능률이 쭉 오르는 날", "할 일부터 차근차근", "무리한 약속은 미루기"],
  건강: ["컨디션이 가벼워요", "적당한 휴식이 보약", "무리 말고 수분·수면 챙기기"],
};

const THEME_META: Record<
  GodCategory,
  {
    headline: [string, string, string];
    do: string;
    dont: string;
    boosts: Partial<Record<string, number>>;
  }
> = {
  인성: {
    headline: ["배움과 귀인의 기운이 가득한 날 ✨", "차분히 채우기 좋은 하루", "느려도 기본기에 충실할 때"],
    do: "배우거나 도움을 청하면 술술 풀려요",
    dont: "혼자 끙끙대며 미루지 않기",
    boosts: { 일: 3, 건강: 3 },
  },
  식상: {
    headline: ["표현하고 베풀수록 빛나는 날 🎨", "아이디어가 잘 도는 하루", "말과 글에 힘이 실리는 때"],
    do: "먼저 표현하고 보여주기",
    dont: "말실수·과한 솔직함은 조심",
    boosts: { 애정: 3, 재물: 3 },
  },
  재성: {
    headline: ["기회와 재물의 기운이 도는 날 💰", "움직인 만큼 얻는 하루", "실리를 챙기기 좋은 때"],
    do: "미뤄둔 거래·정산을 챙기기",
    dont: "충동구매·과욕은 잠시 멈추기",
    boosts: { 재물: 6, 애정: 2 },
  },
  관성: {
    headline: ["책임지고 인정받는 기운의 날 💼", "규칙을 지키면 유리한 하루", "공적인 일이 중요한 때"],
    do: "맡은 일을 반듯하게 마무리",
    dont: "규칙을 어기거나 욱하지 않기",
    boosts: { 일: 6 },
  },
  비겁: {
    headline: ["내 페이스와 사람들의 기운이 도는 날 🤝", "동료·친구와 함께면 좋은 하루", "주관을 세우기 좋은 때"],
    do: "동료와 힘을 합치기",
    dont: "고집·경쟁심으로 부딪히지 않기",
    boosts: { 애정: 2, 건강: 2 },
  },
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** el을 생(生)하는 오행 = 인성 오행(나를 돕는 기운). 부족 오행이 없을 때 럭키 기본값. */
function generatorOf(el: Element): Element {
  return ELEMENTS[(ELEMENTS.indexOf(el) + 4) % 5]!;
}

/** 오행별 기운이 좋은 시간대(친근하게 표기). 럭키 시간대로 안내. */
const LUCKY_TIME: Record<Element, string> = {
  목: "이른 아침 (5~7시)",
  화: "한낮 (11~13시)",
  토: "이른 오후 (13~15시)",
  금: "늦은 오후 (15~19시)",
  수: "밤 (21~23시)",
};

function band(s: number): 0 | 1 | 2 {
  return s >= 75 ? 0 : s >= 55 ? 1 : 2;
}

function occupationTip(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (/student|학생|수험|취준|고3|대학/.test(s)) return "공부·시험은 오전 집중 시간을 노리면 효율이 좋아요";
  if (/office|직장|회사|worker|employee|사원|팀/.test(s)) return "중요한 보고·미팅은 컨디션 좋은 시간대로";
  if (/biz|business|사업|자영|창업|대표|영업|프리/.test(s)) return "계약·거래는 한 번 더 꼼꼼히 확인하고 진행하기";
  return undefined;
}

/** 한국 시간(KST) 기준 오늘 날짜. 서버 런타임용(호출부에서 주입). */
export function koreaToday(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function computeDailyKit(
  chart: Chart,
  today: { year: number; month: number; day: number },
  occupation?: string,
): DailyKit {
  const saju = calculateSaju(today.year, today.month, today.day);
  const dayGanji = saju.dayPillar; // 한글 간지 (예: "갑자")
  const todayStem = STEMS[dayGanji[0]!]!;
  const dm = chart.dayMaster;
  const theme = categoryFor(dm.element, dm.yinYang, todayStem.element, todayStem.yinYang);
  const tEl = todayStem.element;

  const seed = hashStr(`${dm.stem}|${dayGanji}|${today.year}-${today.month}-${today.day}`);

  let score = BASE_SCORE[theme];
  if (chart.lacking.includes(tEl)) score += 8; // 오늘 기운이 부족한 오행을 채움
  if (chart.dominant.includes(tEl)) score -= 5; // 이미 강한 오행을 더 보탬(과다)
  if (chart.dominant.some((d) => controls(tEl, d))) score += 4; // 강한 오행을 눌러 균형
  score += (seed % 11) - 5;
  score = clamp(score, 38, 98);
  const stars = clamp(Math.round(score / 20), 1, 5);

  const meta = THEME_META[theme];
  const headline = meta.headline[band(score)];

  const domains: DailyDomain[] = (["애정", "재물", "일", "건강"] as const).map((key, i) => {
    const boost = meta.boosts[key] ?? 0;
    const dscore = clamp(score + boost + (((seed >> (i + 1)) % 7) - 3), 35, 99);
    return { key, emoji: DOMAIN_EMOJI[key]!, score: dscore, line: DOMAIN_PHRASES[key]![band(dscore)] };
  });

  const favorableElement: Element = chart.lacking[0] ?? generatorOf(dm.element);
  const oh = OHAENG[favorableElement];
  const lucky = {
    element: favorableElement,
    color: oh.color,
    numbers: oh.numbers,
    direction: oh.direction,
    item: oh.items[seed % oh.items.length]!,
    food: oh.food,
    time: LUCKY_TIME[favorableElement],
  };

  const dos = [meta.do, oh.do];
  const donts = [meta.dont, oh.dont];
  const tip = occupationTip(occupation);
  if (tip) dos.push(tip);

  return {
    date: today,
    dayGanji,
    theme,
    score,
    stars,
    headline,
    domains,
    lucky,
    dos,
    donts,
    favorableElement,
  };
}
