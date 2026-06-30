/**
 * 데일리 럭키 키트 산출 — 오늘 일진(간지) vs 명식(일간) → 점수·키워드·럭키·do/don'ts.
 * (getTodayFortune 툴이 사용). 스케줄 친화: 같은 명식·같은 날짜면 항상 같은 결과(재현 가능),
 * 단 날짜가 바뀌면 결과가 바뀐다(idempotentHint:false).
 *
 * 콘텐츠 깊이: 매일 재방문해도 질리지 않도록 문구 풀을 넉넉히 두고, 명식+날짜 시드로
 * 변주를 고른다(결정론 유지). 모든 산출은 순수 함수, 오늘 날짜는 호출부가 주입(테스트 용이).
 */
import { calculateSaju } from "@fullstackfamily/manseryeok";
import type { Chart } from "./chart.js";
import {
  ELEMENTS,
  STEMS,
  BRANCHES,
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
  /** 점수+분야를 엮은 한두 줄 종합평("점수만 보면 뭘 하라는지 모름" 보완). */
  summary: string;
  /** 오늘 참고할 인연 팁 — 나와 합이 좋은 띠(=나이대) + 힘이 되는 기운 + 행동. */
  affinity: { animals: string[]; element: Element; note: string };
  /** 카톡 '나와의 채팅' 발송용 ≤200자 한 줄 요약(에이전트가 데일리 푸시로 그대로 전송). */
  pushLine: string;
}

type Band = "상" | "중" | "하";

const BASE_SCORE: Record<GodCategory, number> = {
  인성: 72,
  식상: 70,
  재성: 67,
  비겁: 62,
  관성: 60,
};

const DOMAIN_EMOJI: Record<string, string> = { 애정: "💗", 재물: "💰", 일: "💼", 건강: "🌿" };

/** 도메인별 상/중/하 문구 풀(시드로 변주). */
const DOMAIN_PHRASES: Record<string, Record<Band, string[]>> = {
  애정: {
    상: ["마음이 잘 통하는 하루예요", "설레는 신호가 오는 날", "먼저 표현하면 더 좋은 날"],
    중: ["먼저 다가가면 좋은 흐름", "평소처럼이 정답인 날", "작은 관심이 통하는 날"],
    하: ["오해 없게 한 박자 천천히", "말보다 들어주기 좋은 날", "무리한 기대는 잠시 접기"],
  },
  재물: {
    상: ["채워질 일이 더 많은 흐름", "들어올 구석이 보이는 날", "작은 이득이 따르는 날"],
    중: ["큰 욕심만 빼면 무난해요", "쓸 데만 쓰면 되는 날", "계획대로면 안전한 날"],
    하: ["지출 관리에 신경 쓰기 좋은 날", "큰 결제는 미루기 좋은 날", "숫자를 한 번 더 확인할 날"],
  },
  일: {
    상: ["능률이 쭉 오르는 날", "집중이 잘 되는 하루", "성과가 눈에 보이는 날"],
    중: ["할 일부터 차근차근", "페이스 유지가 답인 날", "무난하게 굴러가는 날"],
    하: ["무리한 약속은 미루기", "쉬어가며 하기 좋은 날", "욕심보다 마무리에 집중"],
  },
  건강: {
    상: ["컨디션이 가벼워요", "몸이 잘 따라주는 날", "활력이 도는 하루"],
    중: ["적당한 휴식이 보약", "평소 루틴 유지가 좋은 날", "가벼운 산책 추천"],
    하: ["무리 말고 수분·수면 챙기기", "피로 신호를 흘리지 말기", "따뜻하게 몸을 돌보기"],
  },
};

const THEME_META: Record<
  GodCategory,
  {
    headlines: Record<Band, string[]>;
    do: string[];
    dont: string[];
    boosts: Partial<Record<string, number>>;
  }
> = {
  인성: {
    headlines: {
      상: ["배움과 귀인의 기운이 가득한 날 ✨", "도와주는 손길이 닿는 하루", "머리가 맑고 집중이 잘 되는 날", "노력이 결실로 이어지는 날", "좋은 정보·인연이 들어오는 날", "귀인의 한마디가 길을 여는 날", "차분한 몰입이 빛나는 하루", "배운 게 술술 풀리는 날"],
      중: ["차분히 채우기 좋은 하루", "기본기에 충실하면 무난한 날", "서두르지 않으면 술술 풀려요", "여유를 갖고 채워가는 하루", "기초를 다지기 좋은 날", "한 박자 천천히가 정답인 날", "복습·정리가 잘 되는 하루", "마음을 가다듬기 좋은 날"],
      하: ["조금 느려도 괜찮은 날", "욕심보다 휴식이 약이 되는 하루", "받기보다 비우기 좋은 날", "잠시 충전이 필요한 날", "무리보다 회복이 먼저인 하루", "생각이 많아지는 날, 쉬어가기", "혼자만의 시간이 보약인 하루", "과부하는 내려놓기 좋은 날"],
    },
    do: ["배우거나 도움을 청하면 술술 풀려요", "책·강의로 머리를 채우기", "감사 인사를 먼저 건네기", "선배·멘토에게 연락하기"],
    dont: ["혼자 끙끙대며 미루기", "과한 밤샘·무리한 공부", "받기만 하고 안 베풀기", "결정을 끝없이 미루기"],
    boosts: { 일: 3, 건강: 3 },
  },
  식상: {
    headlines: {
      상: ["표현하고 베풀수록 빛나는 날 🎨", "아이디어가 팡팡 터지는 하루", "말과 글에 힘이 실리는 날", "재능이 술술 나오는 날", "주목받기 좋은 하루", "끼와 센스가 통하는 날", "새 시도가 즐거운 하루", "사람들 앞에서 빛나는 날"],
      중: ["가볍게 시작해보기 좋은 하루", "손을 움직이면 풀리는 날", "작은 시도가 즐거운 날", "재미있는 일이 생기는 하루", "가볍게 표현해보면 좋은 날", "수다로 기분이 풀리는 날", "취미에 손이 가는 하루", "소소한 영감이 오는 날"],
      하: ["말은 아끼는 게 좋은 하루", "에너지를 안으로 모으는 날", "무리한 표현은 다음에", "조용히 정리하기 좋은 날", "입보다 손이 편한 하루", "과한 솔직함은 잠시 접기", "벌이기보다 마무리하는 날", "혼자 충전이 필요한 하루"],
    },
    do: ["먼저 표현하고 보여주기", "새 아이디어를 메모해두기", "맛있는 걸 나눠 먹기", "가벼운 콘텐츠를 만들어보기"],
    dont: ["말실수·과한 솔직함은 조심", "벌이기만 하고 마무리 안 하기", "즉흥 소비", "뒷심 없이 흐지부지"],
    boosts: { 애정: 3, 재물: 3 },
  },
  재성: {
    headlines: {
      상: ["기회와 재물의 기운이 도는 날 💰", "움직인 만큼 들어오는 하루", "감 잡은 일에 속도 내기 좋은 날", "노력이 돈으로 이어지는 날", "거래운이 따르는 하루", "실리가 손에 잡히는 날", "협상·거래에 강한 하루", "기회를 잡기 좋은 날"],
      중: ["실속을 챙기기 좋은 하루", "과욕만 빼면 무난한 날", "꼼꼼히 챙기면 이득인 날", "알뜰함이 빛나는 하루", "기회를 살피기 좋은 날", "씀씀이를 점검하기 좋은 날", "차근차근 모으는 하루", "정보를 모아두면 좋은 날"],
      하: ["지갑은 닫아두기 좋은 날", "큰 결정은 미루는 하루", "숫자를 한 번 더 확인할 날", "씀씀이를 점검할 하루", "작은 손해는 넘기기 좋은 날", "충동구매를 조심할 날", "큰 거래는 다음으로 미루기", "돈 약속은 신중히 하는 하루"],
    },
    do: ["미뤄둔 거래·정산을 챙기기", "가계부·예산을 점검하기", "기회가 보이면 한 발 내딛기", "필요한 정보를 모아두기"],
    dont: ["충동구매·과욕", "확인 없는 큰 계약", "돈 약속을 가볍게 하기", "욕심에 무리수 두기"],
    boosts: { 재물: 6, 애정: 2 },
  },
  관성: {
    headlines: {
      상: ["책임지고 인정받는 기운의 날 💼", "맡은 일이 술술 인정받는 하루", "공적인 자리에서 빛나는 날", "노력이 인정받는 날", "맡은 일이 잘 풀리는 하루", "신뢰가 쌓이는 하루", "리더십이 통하는 날", "결과로 증명하기 좋은 날"],
      중: ["규칙을 지키면 유리한 하루", "차근차근이 답인 날", "맡은 만큼만 하면 되는 날", "성실함이 통하는 하루", "기본을 지키면 좋은 날", "맡은 일에 집중하기 좋은 날", "약속을 지키면 무난한 하루", "꾸준함이 빛나는 날"],
      하: ["무리한 약속은 피할 하루", "압박은 흘려보내기 좋은 날", "욱하지 않으면 무사한 날", "어깨 힘을 빼도 되는 날", "압박은 내려놓기 좋은 하루", "과한 책임은 나누는 날", "긴장을 풀어도 되는 하루", "완벽주의는 잠시 내려놓기"],
    },
    do: ["맡은 일을 반듯하게 마무리", "약속 시간을 잘 지키기", "윗사람과 소통 한 번 더", "계획을 또렷이 적어두기"],
    dont: ["규칙을 어기거나 욱하기", "무리한 약속 잡기", "윗사람과 각 세우기", "완벽주의로 자책하기"],
    boosts: { 일: 6 },
  },
  비겁: {
    headlines: {
      상: ["내 페이스가 잘 통하는 날 🤝", "동료·친구와 시너지 나는 하루", "주관을 세우기 좋은 날", "내 매력이 통하는 날", "사람들이 따르는 하루", "내 편이 늘어나는 하루", "자신감이 빛나는 날", "함께라 더 강해지는 하루"],
      중: ["함께하면 든든한 하루", "내 속도로 가면 되는 날", "경쟁보다 협력이 좋은 날", "마이웨이가 통하는 하루", "협력이 잘 되는 날", "내 페이스를 지키기 좋은 날", "동료와 손발 맞추는 하루", "고집과 양보 사이 균형의 날"],
      하: ["고집은 잠시 내려둘 하루", "혼자 끌어안지 않기 좋은 날", "비교는 접어두는 날", "남 신경 끄기 좋은 날", "내 속도를 지킬 하루", "경쟁심은 잠시 식히는 날", "혼자 다 하려 말기", "내 페이스가 흔들리기 쉬운 하루"],
    },
    do: ["동료와 힘을 합치기", "친구에게 안부 전하기", "운동으로 체력 채우기", "내 의견을 분명히 말하기"],
    dont: ["고집·경쟁심으로 부딪히기", "남과 비교하며 조급해하기", "혼자 다 떠안기", "감정적으로 직진하기"],
    boosts: { 애정: 2, 건강: 2 },
  },
};

/** 오행별 기운이 좋은 시간대(친근하게 표기). 럭키 시간대로 안내. */
const LUCKY_TIME: Record<Element, string> = {
  목: "이른 아침 (5~7시)",
  화: "한낮 (11~13시)",
  토: "이른 오후 (13~15시)",
  금: "늦은 오후 (15~19시)",
  수: "밤 (21~23시)",
};

// 종합평(점수만으로는 막연 → 한두 줄로 "그래서 뭘 하면 되는지").
const TOP_FOCUS: Record<string, string> = {
  애정: "마음을 먼저 표현해 보고",
  재물: "실리를 챙겨 보고",
  일: "중요한 일을 밀어붙여 보고",
  건강: "활동량을 조금 늘려 보고",
};
const BOTTOM_CARE: Record<string, string> = {
  애정: "기대를 살짝 내려놓으면 편해요",
  재물: "지출을 한 번 더 점검하면 좋아요",
  일: "무리한 일정은 피하는 게 좋아요",
  건강: "휴식을 충분히 챙기는 게 좋아요",
};

// 오늘 참고할 인연 — 테마별 "이런 사람과 이렇게" 행동 팁.
const AFFINITY_NOTE: Record<GodCategory, string> = {
  재성: "함께 실리를 도모하거나 거래·미팅을 잡기 좋아요",
  관성: "윗사람·동료와 호흡을 맞추면 인정받기 좋아요",
  식상: "같이 새로운 걸 시도하거나 수다로 푸는 날",
  인성: "선배·멘토에게 조언을 구하면 도움이 와요",
  비겁: "친구·동료와 힘을 합치면 시너지가 나요",
};

// 지지 합(육합·삼합) — 나(일지)와 호흡이 잘 맞는 띠를 고를 때 사용.
const YUKHAP_D: [string, string][] = [
  ["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"],
];
const SAMHAP_D: string[][] = [
  ["신", "자", "진"], ["해", "묘", "미"], ["인", "오", "술"], ["사", "유", "축"],
];

/** 내 일지(日支)와 합(육합·삼합)이 되는 띠 목록 = "나와 잘 맞는 띠". */
function harmonyAnimals(branch: string): string[] {
  const set = new Set<string>();
  for (const [a, b] of YUKHAP_D) {
    if (a === branch) set.add(b);
    else if (b === branch) set.add(a);
  }
  for (const g of SAMHAP_D) {
    if (g.includes(branch)) for (const x of g) if (x !== branch) set.add(x);
  }
  return [...set].map((b) => BRANCHES[b]!.animal);
}

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

function band(s: number): Band {
  return s >= 75 ? "상" : s >= 55 ? "중" : "하";
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

/** 점수+분야 대비 → 한두 줄 종합평(가장 좋은/약한 분야를 짚어 행동 가이드). */
function computeSummary(score: number, domains: DailyDomain[]): string {
  const lead =
    band(score) === "상"
      ? "전반적으로 기운이 좋은 하루예요."
      : band(score) === "중"
        ? "전반적으로 무난하게 흐르는 하루예요."
        : "전반적으로 조심스럽게 가면 좋은 하루예요.";
  const sorted = [...domains].sort((a, b) => b.score - a.score);
  const top = sorted[0]!;
  const bot = sorted[sorted.length - 1]!;
  if (top.key === bot.key || top.score - bot.score < 6) {
    return `${lead} 네 분야가 고르게 흐르니 평소 페이스를 지키며 보내기 좋아요.`;
  }
  return `${lead} 특히 ${top.emoji}${top.key} 기운이 가장 좋으니 ${TOP_FOCUS[top.key]}, ${bot.emoji}${bot.key}은 ${BOTTOM_CARE[bot.key]}.`;
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
  const headline = pick(meta.headlines[band(score)], seed);

  const domains: DailyDomain[] = (["애정", "재물", "일", "건강"] as const).map((key, i) => {
    const boost = meta.boosts[key] ?? 0;
    const dscore = clamp(score + boost + (((seed >> (i + 1)) % 7) - 3), 35, 99);
    const pool = DOMAIN_PHRASES[key]![band(dscore)];
    return { key, emoji: DOMAIN_EMOJI[key]!, score: dscore, line: pick(pool, seed >> (i + 2)) };
  });

  // 오늘의 럭키 기운: 나를 돕는 오행(부족/인성)과 오늘 일진 오행 중 시드로 택1 → 날마다 변주
  // (예전엔 명식 고정값이라 한 사람에게 매일 같은 색·방향이 나왔음 — 시나리오 QA 지적).
  const helpful = chart.lacking[0] ?? generatorOf(dm.element);
  const luckyCandidates = Array.from(new Set<Element>([helpful, generatorOf(dm.element), tEl]));
  const favorableElement: Element = luckyCandidates[seed % luckyCandidates.length]!;
  const oh = OHAENG[favorableElement];
  const lucky = {
    element: favorableElement,
    color: oh.color,
    numbers: oh.numbers,
    direction: oh.direction,
    item: oh.items[(seed >> 5) % oh.items.length]!,
    food: oh.food,
    time: LUCKY_TIME[favorableElement],
  };

  const dos = [pick(meta.do, seed), oh.do];
  const donts = [pick(meta.dont, seed >> 3), oh.dont];
  const tip = occupationTip(occupation);
  if (tip) dos.push(tip);

  const summary = computeSummary(score, domains);
  const affinity = {
    animals: harmonyAnimals(chart.pillars.day.branch),
    element: favorableElement,
    note: AFFINITY_NOTE[theme],
  };

  // 카톡 발송용 ≤200자 한 줄(에이전트가 데일리 푸시로 그대로 전송). 200자 넘으면 압축.
  const topD = [...domains].sort((a, b) => b.score - a.score)[0]!;
  const affAnimals = affinity.animals.slice(0, 2);
  let pushLine = [
    `🌅 오늘의 기운 ${today.month}/${today.day} ${"★".repeat(stars)}${"☆".repeat(5 - stars)} ${score}점`,
    headline,
    `${topD.emoji}${topD.key} ${topD.score} · 🍀 ${lucky.color}·${lucky.item}`,
    affAnimals.length ? `🤝 ${affAnimals.join("·")}띠와 잘 맞아요` : "",
    `👉 "오늘 내 운세 봐줘" — Saju Concierge 🙂`,
  ]
    .filter(Boolean)
    .join("\n");
  if (pushLine.length > 200) {
    pushLine = [
      `🌅 오늘의 기운 ${today.month}/${today.day} ${score}점 ${headline}`,
      `${topD.emoji}${topD.key} ${topD.score} · 🍀 ${lucky.color}`,
      `👉 "오늘 내 운세 봐줘" — Saju Concierge`,
    ]
      .join("\n")
      .slice(0, 200);
  }

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
    summary,
    affinity,
    pushLine,
  };
}
