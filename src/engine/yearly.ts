/**
 * 올해(특정 연도) 운세 산출 — 세운(해당 연도 간지) 천간 vs 일간 → 십신 테마 →
 * 연 흐름 + 분기(계절) 키워드. (getYearlyFortune 툴이 사용). 결정론적 순수 함수.
 *
 * 주: 대운(大運)은 v1 범위 밖(양남음녀 순역·대운수 계산 필요) — 세운 기준 개략만 제공하고
 * description도 그에 맞춘다(없는 기능 광고 금지). 추후 대운 보강 가능.
 */
import { calculateSaju } from "@fullstackfamily/manseryeok";
import type { Chart } from "./chart.js";
import { ELEMENTS, STEMS, controls, categoryFor, type Element, type GodCategory } from "./elements.js";
import { OHAENG } from "../data/ohaeng.js";

export interface YearlyFortune {
  year: number;
  yearGanji: string;
  theme: GodCategory;
  score: number;
  stars: number;
  headline: string;
  overview: string;
  keywords: string[];
  seasons: { name: string; line: string }[];
  favorableElement: Element;
}

const BASE_SCORE: Record<GodCategory, number> = { 인성: 74, 식상: 72, 재성: 70, 비겁: 66, 관성: 64 };

const THEME: Record<
  GodCategory,
  { headline: string; overview: string; keywords: string[]; seasons: [string, string, string, string] }
> = {
  인성: {
    headline: "배움과 귀인의 해 ✨",
    overview: "공부·자격·자기계발이 잘 풀리고, 도와주는 사람을 만나기 좋은 흐름이에요.",
    keywords: ["학습", "귀인", "안정"],
    seasons: [
      "봄: 새 공부·자격 준비를 시작하기 좋아요",
      "여름: 멘토·선배의 조언이 큰 힘이 돼요",
      "가을: 배운 것을 정리해 내 것으로 만드는 때",
      "겨울: 충전하며 다음 도약을 준비",
    ],
  },
  식상: {
    headline: "표현과 도전으로 넓히는 해 🎨",
    overview: "아이디어·재능을 밖으로 펼치기 좋은 해. 새 시도와 콘텐츠가 빛을 봅니다.",
    keywords: ["창의", "도전", "확장"],
    seasons: [
      "봄: 새 프로젝트·취미를 가볍게 시작",
      "여름: 활동량을 늘리면 기회가 따라와요",
      "가을: 벌인 일 중 될 것에 집중하기",
      "겨울: 성과를 콘텐츠로 남겨두기",
    ],
  },
  재성: {
    headline: "기회와 재물을 잡기 좋은 해 💰",
    overview: "움직인 만큼 얻는 실리의 해. 거래·투자·이직에서 기회가 보입니다.",
    keywords: ["재물", "기회", "실리"],
    seasons: [
      "봄: 정보 수집·인맥 정비로 밑작업",
      "여름: 적극적으로 기회를 잡아보는 때",
      "가을: 결실을 챙기고 과욕은 줄이기",
      "겨울: 수익을 지키고 다음 해 계획",
    ],
  },
  관성: {
    headline: "책임이 커지고 인정받는 해 💼",
    overview: "승진·합격·공적인 일에 유리한 해. 규칙을 지키면 신뢰가 쌓입니다.",
    keywords: ["성취", "책임", "명예"],
    seasons: [
      "봄: 목표와 계획을 또렷이 세우기",
      "여름: 맡은 일에 집중하면 인정받아요",
      "가을: 결과로 평가받는 중요한 시기",
      "겨울: 무리한 확장보다 안정 다지기",
    ],
  },
  비겁: {
    headline: "독립과 관계를 재정비하는 해 🤝",
    overview: "내 주관을 세우고 사람 관계를 정리하기 좋은 해. 협업과 경쟁이 함께 옵니다.",
    keywords: ["독립", "관계", "주도"],
    seasons: [
      "봄: 내가 원하는 방향을 분명히 하기",
      "여름: 동료와 힘을 합치면 시너지",
      "가을: 관계의 선을 건강하게 정리",
      "겨울: 내 페이스로 마무리·충전",
    ],
  },
};

function generatorOf(el: Element): Element {
  return ELEMENTS[(ELEMENTS.indexOf(el) + 4) % 5]!;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const SEASON_NAMES = ["봄", "여름", "가을", "겨울"];

export function computeYearlyFortune(chart: Chart, year: number): YearlyFortune {
  // 세운 간지 = 해당 연도 간지. 입춘 이후로 안전하게 잡기 위해 연중(6/15) 기준.
  const saju = calculateSaju(year, 6, 15);
  const yearGanji = saju.yearPillar;
  const yearStem = STEMS[yearGanji[0]!]!;
  const dm = chart.dayMaster;
  const theme = categoryFor(dm.element, dm.yinYang, yearStem.element, yearStem.yinYang);
  const tEl = yearStem.element;

  const seed = hashStr(`${dm.stem}|${yearGanji}|${year}`);
  let score = BASE_SCORE[theme];
  if (chart.lacking.includes(tEl)) score += 8;
  if (chart.dominant.includes(tEl)) score -= 5;
  if (chart.dominant.some((d) => controls(tEl, d))) score += 4;
  score += (seed % 11) - 5;
  score = Math.max(42, Math.min(97, score));
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));

  const meta = THEME[theme];
  const favorableElement: Element = chart.lacking[0] ?? generatorOf(dm.element);

  return {
    year,
    yearGanji,
    theme,
    score,
    stars,
    headline: meta.headline,
    overview: meta.overview,
    keywords: meta.keywords,
    seasons: meta.seasons.map((line, i) => ({ name: SEASON_NAMES[i]!, line })),
    favorableElement,
  };
}
