/**
 * 사주 16유형 — 명식을 MBTI식 4축으로 압축한 "사주 유형". 공유·바이럴 시그니처(D-108).
 *
 * 4축(각 축은 명식에서 결정론적으로 산출 — `engine/personality.ts`):
 *  - 음양: 일간의 음양 (양=직접·활동 / 음=섬세·내면)
 *  - 기세: 신강/신약 = 나를 돕는 힘(비겁+인성) vs 쓰는 힘(식상+재성+관성) (강=주관·추진 / 유=유연·적응)
 *  - 성향: 식상 vs 관성 (발=표현·발산 / 절=절제·체계)
 *  - 기온: 목+화 vs 금+수 (온=따뜻·확장 / 냉=냉철·응축)
 *
 * 코드 = 음양+기세+성향+기온 (예: "양강발온"). 모두 자체 작성, 엔터테인먼트 톤.
 */

export interface SajuTypeInfo {
  /** 별명. */
  name: string;
  emoji: string;
  /** 한 줄 소개. */
  tagline: string;
  strengths: string;
  cautions: string;
  fields: string;
}

export type AxisPick = { label: string; desc: string };

export const AXIS_META: {
  음양: Record<"양" | "음", AxisPick>;
  기세: Record<"강" | "유", AxisPick>;
  성향: Record<"발" | "절", AxisPick>;
  기온: Record<"온" | "냉", AxisPick>;
} = {
  음양: {
    양: { label: "양(陽)", desc: "직접적이고 활동적" },
    음: { label: "음(陰)", desc: "섬세하고 내면적" },
  },
  기세: {
    강: { label: "강(强)", desc: "주관 뚜렷·추진형" },
    유: { label: "유(柔)", desc: "유연·적응형" },
  },
  성향: {
    발: { label: "발(發)", desc: "표현·발산형" },
    절: { label: "절(節)", desc: "절제·체계형" },
  },
  기온: {
    온: { label: "온(溫)", desc: "따뜻·확장" },
    냉: { label: "냉(冷)", desc: "냉철·응축" },
  },
};

export const SAJU_TYPES: Record<string, SajuTypeInfo> = {
  양강발온: {
    name: "불꽃 개척가",
    emoji: "🔥",
    tagline: "앞장서서 판을 여는 뜨거운 추진가",
    strengths: "도전정신·리더십·에너지·실행력",
    cautions: "속도 조절과 주변 배려가 필요해요",
    fields: "창업·영업·스포츠·신사업 기획",
  },
  양강발냉: {
    name: "승부 전략가",
    emoji: "⚡",
    tagline: "냉정하게 계산하고 과감히 지르는 승부사",
    strengths: "결단력·집중력·승부욕·돌파력",
    cautions: "독선과 조급함은 한 번 더 점검",
    fields: "투자·세일즈·스타트업·협상",
  },
  양강절온: {
    name: "따뜻한 대장",
    emoji: "🏛️",
    tagline: "원칙과 정으로 사람을 이끄는 맏형·맏언니",
    strengths: "책임감·통솔력·포용·신뢰",
    cautions: "참견과 고집은 살짝 내려놓기",
    fields: "관리자·공직·교육·조직 리더",
  },
  양강절냉: {
    name: "원칙의 지휘관",
    emoji: "🗡️",
    tagline: "규율과 기준으로 조직을 세우는 사령관",
    strengths: "추진력·원칙·위기대응·책임감",
    cautions: "완벽주의와 경직됨을 풀어주기",
    fields: "군경·법무·감사·운영 총괄",
  },
  양유발온: {
    name: "인싸 무드메이커",
    emoji: "🌈",
    tagline: "어디서나 분위기를 살리는 사교의 달인",
    strengths: "친화력·낙천성·표현력·센스",
    cautions: "산만함과 결정 미루기를 조심",
    fields: "방송·이벤트·서비스·홍보",
  },
  양유발냉: {
    name: "재치 크리에이터",
    emoji: "🎤",
    tagline: "톡톡 튀는 아이디어로 사로잡는 재간둥이",
    strengths: "창의력·언변·순발력·트렌드 감각",
    cautions: "변덕과 뒷심 부족을 보완하기",
    fields: "콘텐츠·마케팅·디자인·기획",
  },
  양유절온: {
    name: "친화 조율가",
    emoji: "🤝",
    tagline: "사람 사이를 부드럽게 잇는 분위기 메이커",
    strengths: "공감력·조율·성실·배려",
    cautions: "거절을 어려워하는 점에 주의",
    fields: "인사·상담·코디네이터·교육",
  },
  양유절냉: {
    name: "스마트 실무가",
    emoji: "🎯",
    tagline: "조용히 일 처리 깔끔한 똑부러진 해결사",
    strengths: "꼼꼼함·실무력·신뢰·효율",
    cautions: "지나친 신중함으로 늦지 않기",
    fields: "기획·회계·운영·데이터",
  },
  음강발온: {
    name: "뚝심 기획자",
    emoji: "🌱",
    tagline: "속은 단단, 끈기로 키워내는 성장형",
    strengths: "끈기·기획력·성실·집념",
    cautions: "혼자 다 떠안지 않기",
    fields: "기획·연구개발·교육·창작",
  },
  음강발냉: {
    name: "집요한 분석가",
    emoji: "🔍",
    tagline: "끝까지 파고들어 답을 찾는 전문가형",
    strengths: "분석력·집중력·전문성·통찰",
    cautions: "비판적·예민해지지 않게 균형",
    fields: "연구·엔지니어·전문직·전략",
  },
  음강절온: {
    name: "신뢰의 멘토",
    emoji: "📚",
    tagline: "묵묵히 받쳐주는 든든한 어른",
    strengths: "신뢰·인내·배려·지혜",
    cautions: "표현 부족과 자기희생에 주의",
    fields: "교육·자문·돌봄·전문직",
  },
  음강절냉: {
    name: "냉철한 전략가",
    emoji: "♟️",
    tagline: "감정에 흔들리지 않는 두뇌파",
    strengths: "전략·판단력·원칙·인내",
    cautions: "고집과 차가움을 풀어주기",
    fields: "전략기획·법무·금융·감사",
  },
  음유발온: {
    name: "감성 아티스트",
    emoji: "🎨",
    tagline: "마음을 어루만지는 감성 표현가",
    strengths: "감성·창의·공감·미적 감각",
    cautions: "기분의 기복을 다독이기",
    fields: "예술·디자인·상담·콘텐츠",
  },
  음유발냉: {
    name: "센스 관찰자",
    emoji: "🦊",
    tagline: "조용히 다 보고 핵심을 짚는 눈치 고수",
    strengths: "관찰력·재치·유연함·통찰",
    cautions: "속내를 너무 감추지 않기",
    fields: "기획·리서치·상담·마케팅",
  },
  음유절온: {
    name: "다정한 살림꾼",
    emoji: "🍵",
    tagline: "주변을 살뜰히 챙기는 따뜻한 손길",
    strengths: "배려·성실·안정감·세심함",
    cautions: "걱정 과다와 우유부단에 주의",
    fields: "행정·돌봄·서비스·관리",
  },
  음유절냉: {
    name: "사색의 현자",
    emoji: "🌙",
    tagline: "깊이 사유하는 조용한 지혜파",
    strengths: "통찰·차분함·전문성·자기관리",
    cautions: "고립과 생각 과잉을 경계",
    fields: "학문·연구·집필·전문직",
  },
};
