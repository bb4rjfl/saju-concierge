/**
 * 사주 유형(16) 산출 — 명식 → 4축 → 유형 코드/별명. (analyzePersonality 툴이 사용)
 *
 * 결정론적 순수 함수: 같은 명식이면 항상 같은 유형 → 테스트 가능, idempotent.
 * 축 정의·근거는 `data/sajuType.ts` 주석 참조.
 */
import type { Chart } from "./chart.js";
import {
  STEMS,
  BRANCHES,
  categoryFor,
  type GodCategory,
} from "./elements.js";
import { SAJU_TYPES, AXIS_META, type SajuTypeInfo } from "../data/sajuType.js";

export interface SajuTypeResult {
  /** 4축 코드, 예: "양강발온". */
  code: string;
  axes: { key: string; label: string; desc: string }[];
  info: SajuTypeInfo;
  /** 5개 신(神) 무리 분포 — 강점/약점 해석용. */
  categories: Record<GodCategory, number>;
}

/**
 * 명식 전체(일간 제외 천간 + 모든 지지)를 일간 기준 십신 카테고리로 집계.
 * 일간 자신은 기준점이므로 천간 카운트에서 제외(지지는 일지 포함).
 */
export function computeGodCategories(chart: Chart): Record<GodCategory, number> {
  const dm = chart.dayMaster;
  const cats: Record<GodCategory, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const p = chart.pillars;

  const stems = [p.year.stem, p.month.stem, ...(p.hour ? [p.hour.stem] : [])];
  const branches = [p.year.branch, p.month.branch, p.day.branch, ...(p.hour ? [p.hour.branch] : [])];

  for (const s of stems) {
    const si = STEMS[s]!;
    cats[categoryFor(dm.element, dm.yinYang, si.element, si.yinYang)]++;
  }
  for (const b of branches) {
    const bi = BRANCHES[b]!;
    cats[categoryFor(dm.element, dm.yinYang, bi.element, bi.yinYang)]++;
  }
  return cats;
}

export function computeSajuType(chart: Chart): SajuTypeResult {
  const cats = computeGodCategories(chart);

  // 음양: 일간의 음양
  const yinYang: "양" | "음" = chart.dayMaster.yinYang;
  // 기세(신강/신약): 나를 돕는 힘(비겁+인성, +일간 자신) vs 쓰는 힘(식상+재성+관성)
  const support = cats.비겁 + cats.인성 + 1;
  const drain = cats.식상 + cats.재성 + cats.관성;
  const gise: "강" | "유" = support >= drain ? "강" : "유";
  // 성향(표현/절제): 1차 식상 vs 관성, 동률이면 발산(식상+재성) vs 수렴(관성+인성), 그래도 동률이면 음양으로.
  let seonghyang: "발" | "절";
  if (cats.식상 !== cats.관성) {
    seonghyang = cats.식상 > cats.관성 ? "발" : "절";
  } else {
    const expand = cats.식상 + cats.재성;
    const contract = cats.관성 + cats.인성;
    seonghyang = expand !== contract ? (expand > contract ? "발" : "절") : yinYang === "양" ? "발" : "절";
  }
  // 기온(확장/응축): 목+화 vs 금+수 (토는 중립)
  const warm = chart.elementCounts.목 + chart.elementCounts.화;
  const cool = chart.elementCounts.금 + chart.elementCounts.수;
  const gion: "온" | "냉" = warm >= cool ? "온" : "냉";

  const code = `${yinYang}${gise}${seonghyang}${gion}`;
  const info = SAJU_TYPES[code]!;

  const axes = [
    { key: "음양", ...AXIS_META.음양[yinYang] },
    { key: "기세", ...AXIS_META.기세[gise] },
    { key: "성향", ...AXIS_META.성향[seonghyang] },
    { key: "기온", ...AXIS_META.기온[gion] },
  ];

  return { code, axes, info, categories: cats };
}
