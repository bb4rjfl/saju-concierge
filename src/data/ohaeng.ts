/**
 * 오행(五行) 5 — 성격 키워드 + 럭키 대응(색/숫자/방향/아이템/음식) + 살리는·해치는 행동.
 *
 * 색·숫자·방향·맛은 **공개된 전통 오행 대응**(목=청/동/3·8/신맛, 화=적/남/2·7/쓴맛,
 * 토=황/중앙/5·10/단맛, 금=백/서/4·9/매운맛, 수=흑/북/1·6/짠맛)을 우리 문장으로 정리한
 * 것이다(docs/05). 데일리 럭키 키트(처방전)와 오행 균형 해석에 쓴다.
 */
import type { Element } from "../engine/elements.js";

export interface OhaengInfo {
  hanja: string;
  emoji: string;
  /** 성격 키워드(인의예지신 포함). */
  personality: string;
  /** 럭키 색. */
  color: string;
  /** 럭키 숫자. */
  numbers: number[];
  /** 럭키 방향. */
  direction: string;
  /** 럭키 아이템 후보(날짜 시드로 하나 선택). */
  items: string[];
  /** 기운을 북돋우는 맛/음식(개운법). */
  food: string;
  season: string;
  /** 이 기운을 살리는 행동(do). */
  do: string;
  /** 이 기운을 해치는 행동(don't). */
  dont: string;
}

export const OHAENG: Record<Element, OhaengInfo> = {
  목: {
    hanja: "木",
    emoji: "🌳",
    personality: "성장·기획·인(仁)",
    color: "청록색",
    numbers: [3, 8],
    direction: "동쪽",
    items: ["작은 화분", "나무 소품", "읽고 싶던 책 한 권", "연필·만년필", "초록 식물"],
    food: "새콤한 맛 (제철 과일·식초 음식)",
    season: "봄",
    do: "미뤄둔 계획을 딱 한 걸음 시작해 보기",
    dont: "우유부단하게 결정을 미루기",
  },
  화: {
    hanja: "火",
    emoji: "🔥",
    personality: "열정·표현·예(禮)",
    color: "빨간색",
    numbers: [2, 7],
    direction: "남쪽",
    items: ["빨간 포인트 소품", "향초", "따뜻한 차 한 잔", "레드 액세서리", "캔들 조명"],
    food: "쓴맛·구운 맛 (커피·나물·구이)",
    season: "여름",
    do: "마음을 솔직하게 표현하기",
    dont: "순간의 화를 그대로 터뜨리기",
  },
  토: {
    hanja: "土",
    emoji: "⛰️",
    personality: "신뢰·중심·신(信)",
    color: "노란색·베이지",
    numbers: [5, 10],
    direction: "중앙",
    items: ["도자기 컵", "베이지 소품", "흙빛 화분", "가죽 소품", "원목 트레이"],
    food: "단맛·곡물 (잡곡밥·달콤한 간식)",
    season: "환절기",
    do: "약속과 기본을 지키기",
    dont: "결정을 미루고 떠넘기기",
  },
  금: {
    hanja: "金",
    emoji: "⚪",
    personality: "결단·정리·의(義)",
    color: "흰색",
    numbers: [4, 9],
    direction: "서쪽",
    items: ["금속 액세서리", "손목시계", "깔끔한 흰 셔츠", "은반지·체인", "메탈 텀블러"],
    food: "매운맛 (매콤한 음식·향신료)",
    season: "가을",
    do: "미뤄둔 정리·마무리를 끝내기",
    dont: "지나치게 따지고 날 세우기",
  },
  수: {
    hanja: "水",
    emoji: "💧",
    personality: "지혜·유연·지(智)",
    color: "검은색·남색",
    numbers: [1, 6],
    direction: "북쪽",
    items: ["물 한 잔 충분히", "유리 소품", "파란 펜", "남색 스카프", "물방울 무늬 소품"],
    food: "짠맛·해산물 (국물·생선·콩)",
    season: "겨울",
    do: "천천히 듣고 유연하게 대응하기",
    dont: "생각만 하다 때를 놓치기",
  },
};
