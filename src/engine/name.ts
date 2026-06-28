/**
 * 이름풀이 — 한글 이름의 음(音) 오행 풀이. (interpretName 툴이 사용)
 *
 * 규칙(자체 구현, 공개된 훈민정음 오음→오행 개념): 각 음절의 초성 자음을 오행에 대응
 * (아음 ㄱㅋ=목 / 설음 ㄴㄷㄹㅌ=화 / 순음 ㅁㅂㅍ=수 / 치음 ㅅㅈㅊ=금 / 후음 ㅇㅎ=토),
 * 음절 사이 오행 흐름(상생/상극/비화)과 균형을 본다. 결정론적 순수 함수. 엔터테인먼트 톤.
 */
import { generates, type Element } from "./elements.js";

/** 한글 초성 19개(유니코드 순) → 오행. */
const CHOSEONG_ELEMENT: Element[] = [
  "목", // ㄱ
  "목", // ㄲ
  "화", // ㄴ
  "화", // ㄷ
  "화", // ㄸ
  "화", // ㄹ
  "수", // ㅁ
  "수", // ㅂ
  "수", // ㅃ
  "금", // ㅅ
  "금", // ㅆ
  "토", // ㅇ
  "금", // ㅈ
  "금", // ㅉ
  "금", // ㅊ
  "목", // ㅋ
  "화", // ㅌ
  "수", // ㅍ
  "토", // ㅎ
];

const ALL: Element[] = ["목", "화", "토", "금", "수"];

export interface NameReading {
  name: string;
  syllables: { ch: string; element: Element | null }[];
  counts: Record<Element, number>;
  dominant: Element[];
  lacking: Element[];
  /** 음절 간 오행 흐름 요약. */
  flowLabel: string;
  flowKind: "상생" | "조화" | "비화" | "혼합" | "단일";
}

function choseongElement(ch: string): Element | null {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null; // 완성형 한글이 아니면 제외
  const idx = Math.floor((code - 0xac00) / 588);
  return CHOSEONG_ELEMENT[idx] ?? null;
}

export function readName(name: string): NameReading {
  // 이름은 보통 짧다. 비정상적으로 긴 입력은 앞 10자만(응답 비대화·24k 근접 방지).
  // PII 위생: 숫자·영문·기호·공백은 버리고 완성형 한글 음절만 본다
  // (전화번호·주민번호 조각이 그대로 에코되는 것을 방지).
  const chars = [...name]
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 0xac00 && code <= 0xd7a3;
    })
    .slice(0, 10);
  const syllables = chars.map((ch) => ({ ch, element: choseongElement(ch) }));
  const els = syllables.map((s) => s.element).filter((e): e is Element => e !== null);

  const counts: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const e of els) counts[e]++;
  const max = Math.max(...ALL.map((e) => counts[e]));
  const dominant = max > 0 ? ALL.filter((e) => counts[e] === max) : [];
  const lacking = ALL.filter((e) => counts[e] === 0);

  // 음절 간 관계
  const rels: ("상생" | "상극" | "비화")[] = [];
  for (let i = 1; i < els.length; i++) {
    const a = els[i - 1]!;
    const b = els[i]!;
    if (a === b) rels.push("비화");
    else if (generates(a, b) || generates(b, a)) rels.push("상생");
    else rels.push("상극");
  }

  let flowKind: NameReading["flowKind"];
  let flowLabel: string;
  if (els.length <= 1) {
    flowKind = "단일";
    flowLabel = "한 가지 기운이 또렷한 결";
  } else if (rels.every((r) => r === "상생")) {
    flowKind = "상생";
    flowLabel = "상생 흐름 — 기운이 순하게 이어지는 결";
  } else if (rels.every((r) => r === "비화")) {
    flowKind = "비화";
    flowLabel = "같은 기운으로 단단히 뭉친 결";
  } else if (rels.includes("상극")) {
    flowKind = "혼합";
    flowLabel = "강약이 함께 있는 다이내믹한 결";
  } else {
    flowKind = "조화";
    flowLabel = "상생과 같은 기운이 어우러진 결";
  }

  return { name: chars.join(""), syllables, counts, dominant, lacking, flowLabel, flowKind };
}
