/**
 * 명리학 기초 데이터 — 천간·지지의 오행/음양, 12지지 띠, 오행 상생상극, 십신 산출.
 *
 * 모두 **공개된 일반 명리학 공식**(공식·알고리즘엔 저작권 없음)을 우리 코드로 직접
 * 구현한 것이다 (docs/05). AGPL 등 외부 프로젝트의 코드·데이터 파일은 한 줄도
 * 가져오지 않았다 — 개념만 참고했다.
 *
 * 지지 오행 매핑은 한국천문연구원 기반 manseryeok 엔진(v1.0.6 확정)과 동일:
 * 子수 丑토 寅목 卯목 辰토 巳화 午화 未토 申금 酉금 戌토 亥수.
 */

export type Element = "목" | "화" | "토" | "금" | "수";
export type YinYang = "양" | "음";

/** 오행 순서 = 상생 순환: 목→화→토→금→수→(목). */
export const ELEMENTS: readonly Element[] = ["목", "화", "토", "금", "수"] as const;

export interface StemInfo {
  stem: string;
  hanja: string;
  element: Element;
  yinYang: YinYang;
}

/** 천간 10 → 오행/음양. */
export const STEMS: Record<string, StemInfo> = {
  갑: { stem: "갑", hanja: "甲", element: "목", yinYang: "양" },
  을: { stem: "을", hanja: "乙", element: "목", yinYang: "음" },
  병: { stem: "병", hanja: "丙", element: "화", yinYang: "양" },
  정: { stem: "정", hanja: "丁", element: "화", yinYang: "음" },
  무: { stem: "무", hanja: "戊", element: "토", yinYang: "양" },
  기: { stem: "기", hanja: "己", element: "토", yinYang: "음" },
  경: { stem: "경", hanja: "庚", element: "금", yinYang: "양" },
  신: { stem: "신", hanja: "辛", element: "금", yinYang: "음" },
  임: { stem: "임", hanja: "壬", element: "수", yinYang: "양" },
  계: { stem: "계", hanja: "癸", element: "수", yinYang: "음" },
};

export interface BranchInfo {
  branch: string;
  hanja: string;
  element: Element;
  yinYang: YinYang;
  animal: string;
}

/** 지지 12 → 오행/음양/띠(동물). 양지: 자인진오신술 / 음지: 축묘사미유해. */
export const BRANCHES: Record<string, BranchInfo> = {
  자: { branch: "자", hanja: "子", element: "수", yinYang: "양", animal: "쥐" },
  축: { branch: "축", hanja: "丑", element: "토", yinYang: "음", animal: "소" },
  인: { branch: "인", hanja: "寅", element: "목", yinYang: "양", animal: "호랑이" },
  묘: { branch: "묘", hanja: "卯", element: "목", yinYang: "음", animal: "토끼" },
  진: { branch: "진", hanja: "辰", element: "토", yinYang: "양", animal: "용" },
  사: { branch: "사", hanja: "巳", element: "화", yinYang: "음", animal: "뱀" },
  오: { branch: "오", hanja: "午", element: "화", yinYang: "양", animal: "말" },
  미: { branch: "미", hanja: "未", element: "토", yinYang: "음", animal: "양" },
  신: { branch: "신", hanja: "申", element: "금", yinYang: "양", animal: "원숭이" },
  유: { branch: "유", hanja: "酉", element: "금", yinYang: "음", animal: "닭" },
  술: { branch: "술", hanja: "戌", element: "토", yinYang: "양", animal: "개" },
  해: { branch: "해", hanja: "亥", element: "수", yinYang: "음", animal: "돼지" },
};

function idx(e: Element): number {
  return ELEMENTS.indexOf(e);
}

/** a가 b를 생하는가 (我生, b = 한 칸 뒤: 목→화→토→금→수→목). */
export function generates(a: Element, b: Element): boolean {
  return idx(b) === (idx(a) + 1) % 5;
}

/** a가 b를 극하는가 (我克, b = 두 칸 뒤: 목극토·화극금·토극수·금극목·수극화). */
export function controls(a: Element, b: Element): boolean {
  return idx(b) === (idx(a) + 2) % 5;
}

export type Sipsin =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

/**
 * 일간(dm) 대비 다른 천간의 십신.
 * 같은 오행: 비견(음양 같음)/겁재(다름).
 * 我生(식상): 식신(같음)/상관(다름). 我克(재성): 편재(같음)/정재(다름).
 * 克我(관성): 편관(같음)/정관(다름). 生我(인성): 편인(같음)/정인(다름).
 */
export function sipsinOf(
  dmEl: Element,
  dmYy: YinYang,
  otherEl: Element,
  otherYy: YinYang,
): Sipsin {
  const same = dmYy === otherYy;
  if (otherEl === dmEl) return same ? "비견" : "겁재";
  if (generates(dmEl, otherEl)) return same ? "식신" : "상관"; // 我生
  if (controls(dmEl, otherEl)) return same ? "편재" : "정재"; // 我克
  if (controls(otherEl, dmEl)) return same ? "편관" : "정관"; // 克我
  return same ? "편인" : "정인"; // 生我
}

/** 십신 10을 5개 '신(神)' 무리로 묶은 카테고리. 성향·운세 해석의 뼈대. */
export type GodCategory = "비겁" | "식상" | "재성" | "관성" | "인성";

const SIPSIN_CATEGORY: Record<Sipsin, GodCategory> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  편재: "재성",
  정재: "재성",
  편관: "관성",
  정관: "관성",
  편인: "인성",
  정인: "인성",
};

export function categoryOf(s: Sipsin): GodCategory {
  return SIPSIN_CATEGORY[s];
}

/** 일간(dm) 대비 다른 오행/음양의 십신 카테고리 (천간·지지 공용). */
export function categoryFor(
  dmEl: Element,
  dmYy: YinYang,
  otherEl: Element,
  otherYy: YinYang,
): GodCategory {
  return categoryOf(sipsinOf(dmEl, dmYy, otherEl, otherYy));
}
