/**
 * 궁합 산출 — 두 명식의 일간(오행) 관계 + 띠(지지) 합·충 + 기운 보완.
 * (getCompatibility 툴이 사용). 결정론적 순수 함수 → 테스트·재현 가능(idempotent).
 *
 * 지지 합/충은 공개된 일반 명리 개념(삼합·육합·육충)을 우리 코드로 구현했다(docs/05).
 * 엔터테인먼트 톤: 점수는 40~99로 너무 낮지 않게(불안 조장 금지), 부정은 완곡하게.
 */
import type { Chart } from "./chart.js";
import { generates, type Element } from "./elements.js";

export type DmRel = "상생" | "비화" | "상극";
export type BranchRel = "삼합" | "육합" | "육충" | "무난";

const YUKHAP: [string, string][] = [
  ["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"],
];
const YUKCHUNG: [string, string][] = [
  ["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"],
];
const SAMHAP: string[][] = [
  ["신", "자", "진"], ["해", "묘", "미"], ["인", "오", "술"], ["사", "유", "축"],
];

export interface Compatibility {
  relationKey: "love" | "friend" | "work" | "any";
  relationLabel: string;
  score: number; // 40~99
  hearts: number; // 1~5
  headline: string;
  /** 공유용 한 줄 캐치프레이즈(오행 비유). */
  catchphrase: string;
  dmRelation: DmRel;
  dmNote: string;
  branchRelation: BranchRel;
  branchNote: string;
  complementNote: string;
  strengths: string;
  cautions: string;
}

function dmRelation(a: Element, b: Element): DmRel {
  if (a === b) return "비화";
  if (generates(a, b) || generates(b, a)) return "상생";
  return "상극"; // 서로 극하는 관계
}

function branchRelation(a: string, b: string): BranchRel {
  if (a === b) return "무난"; // 같은 띠
  if (YUKHAP.some((p) => p.includes(a) && p.includes(b))) return "육합";
  if (SAMHAP.some((g) => g.includes(a) && g.includes(b))) return "삼합";
  if (YUKCHUNG.some((p) => p.includes(a) && p.includes(b))) return "육충";
  return "무난";
}

/** A의 부족 오행을 B가 채워주는 개수(+그 반대). 0~다수. */
function complementFills(a: Chart, b: Chart): number {
  let fills = 0;
  for (const e of a.lacking) if (b.elementCounts[e] > 0) fills++;
  for (const e of b.lacking) if (a.elementCounts[e] > 0) fills++;
  return fills;
}

function normRelation(raw?: string): { key: Compatibility["relationKey"]; label: string } {
  const s = (raw ?? "").toLowerCase();
  if (/love|연인|애인|사랑|커플|남친|여친|이성|결혼|썸/.test(s)) return { key: "love", label: "연인 궁합" };
  if (/friend|친구|우정|베프|동성/.test(s)) return { key: "friend", label: "친구 궁합" };
  if (/work|동료|직장|business|파트너|사업|상사/.test(s)) return { key: "work", label: "동료 궁합" };
  return { key: "any", label: "궁합" };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const DM_BASE: Record<DmRel, number> = { 상생: 78, 비화: 70, 상극: 64 };
const BRANCH_ADJ: Record<BranchRel, number> = { 삼합: 10, 육합: 8, 무난: 0, 육충: -10 };

const DM_NOTE: Record<DmRel, string> = {
  상생: "서로를 북돋아 주는 결",
  비화: "비슷한 결이라 말이 잘 통하는 사이",
  상극: "끌리지만 가끔 부딪히는 스파크",
};
// 라벨(삼합/육합/육충)은 렌더에서 붙이므로 여기엔 설명만(이중 출력 방지).
const BRANCH_NOTE: Record<BranchRel, string> = {
  삼합: "손발이 척척 맞는 환상의 띠 궁합",
  육합: "자연스레 가까워지는 띠 궁합",
  무난: "무난하게 흐르는 띠 조합",
  육충: "밀당이 있는 다이내믹한 띠 조합",
};

const STRENGTHS: Record<DmRel, string> = {
  상생: "서로 채워주고 응원하는 힘이 강해요",
  비화: "취향·속도가 비슷해 함께 있으면 편안해요",
  상극: "서로에게 자극과 성장을 주는 사이예요",
};

function cautionFor(dr: DmRel, br: BranchRel, key: Compatibility["relationKey"]): string {
  if (br === "육충") return "가끔 세게 부딪힐 수 있으니 한 박자 쉬어가기";
  if (dr === "상극") return "다름을 인정하면 오히려 오래가는 조합이에요";
  if (key === "love") return "익숙함에 무심해지지 않게 표현하기";
  return "편할수록 작은 배려를 잊지 않기";
}

function band(score: number): 0 | 1 | 2 {
  return score >= 80 ? 0 : score >= 62 ? 1 : 2;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

const HEADLINES: [string[], string[], string[]] = [
  ["찰떡같이 잘 맞는 조합이에요 💞", "말 안 해도 통하는 케미 ✨", "함께라 더 빛나는 사이"],
  ["맞춰가면 좋은 케미가 나는 사이", "알아갈수록 좋아지는 사이", "조금만 맞추면 찰떡인 사이"],
  ["다른 매력이 부딪히는, 노력이 빛나는 사이", "밀당의 재미가 있는 사이", "서로 배우며 크는 사이"],
];

const ELEMENT_TAG: Record<Element, string> = {
  목: "새싹 같은",
  화: "불꽃 같은",
  토: "든든한 산 같은",
  금: "단단한 쇠 같은",
  수: "물처럼 유연한",
};

export function computeCompatibility(a: Chart, b: Chart, relation?: string): Compatibility {
  const rel = normRelation(relation);
  const dr = dmRelation(a.dayMaster.element, b.dayMaster.element);
  const br = branchRelation(a.pillars.year.branch, b.pillars.year.branch);
  const fills = complementFills(a, b);

  // 순서 무관(대칭) 시드 — 누가 personA든 같은 궁합 점수·헤드라인이 나오게(공유 신뢰성).
  const pairKey = [`${a.pillars.day.name}${a.animal}`, `${b.pillars.day.name}${b.animal}`].sort().join("|");
  const seed = hashStr(pairKey);
  let score = DM_BASE[dr] + BRANCH_ADJ[br] + Math.min(8, fills * 4) + ((seed % 7) - 3);
  score = Math.max(40, Math.min(99, score));
  const hearts = Math.max(1, Math.min(5, Math.round(score / 20)));

  const complementNote =
    fills >= 2
      ? "서로 부족한 기운을 잘 채워줘요"
      : fills === 1
        ? "한쪽 기운을 살짝 보완해 주는 사이"
        : "각자 색이 뚜렷한 조합";

  return {
    relationKey: rel.key,
    relationLabel: rel.label,
    score,
    hearts,
    headline: pick(HEADLINES[band(score)], seed),
    catchphrase: `${ELEMENT_TAG[a.dayMaster.element]} ${a.animal}띠 ✕ ${ELEMENT_TAG[b.dayMaster.element]} ${b.animal}띠`,
    dmRelation: dr,
    dmNote: DM_NOTE[dr],
    branchRelation: br,
    branchNote: BRANCH_NOTE[br],
    complementNote,
    strengths: STRENGTHS[dr],
    cautions: cautionFor(dr, br, rel.key),
  };
}
