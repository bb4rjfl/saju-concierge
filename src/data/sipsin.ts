/**
 * 십신(十神) 10 — 의미·강약·어울리는 분야. 성향/궁합 해석의 핵심 어휘다.
 *
 * 모두 **공개된 일반 명리학 개념**을 우리 문장으로 직접 작성했다(docs/05). 특정
 * 사이트의 문장을 복사하지 않았다. 톤은 엔터테인먼트·건설적(단정·공포 금지).
 */
import type { Sipsin } from "../engine/elements.js";

export interface SipsinInfo {
  hanja: string;
  /** 한 줄 핵심. */
  short: string;
  /** 잘 살아날 때의 키워드. */
  strong: string;
  /** 과하면 생기는 주의점(완곡하게). */
  caution: string;
  /** 어울리는 분야. */
  fields: string;
}

export const SIPSIN_INFO: Record<Sipsin, SipsinInfo> = {
  비견: {
    hanja: "比肩",
    short: "자립과 주체성 — 내 힘으로 서는 기운",
    strong: "독립심·소신·체력·동료애",
    caution: "고집과 자기중심으로 흐를 수 있어요",
    fields: "전문직·1인 사업·스포츠·기술",
  },
  겁재: {
    hanja: "劫財",
    short: "승부와 추진 — 과감하게 부딪히는 기운",
    strong: "경쟁심·결단·사교·배짱",
    caution: "충동적 지출·과욕은 한 박자 쉬어가기",
    fields: "영업·창업·투자·승부의 영역",
  },
  식신: {
    hanja: "食神",
    short: "표현과 여유 — 즐기며 만들어내는 기운",
    strong: "낙천·창의·꾸준함·미식",
    caution: "편안함에 안주하지 않기",
    fields: "요리·콘텐츠·교육·서비스",
  },
  상관: {
    hanja: "傷官",
    short: "재능과 끼 — 톡톡 튀는 표현의 기운",
    strong: "창의·언변·순발력·감각",
    caution: "직설적 표현은 부드럽게 다듬기",
    fields: "예술·방송·디자인·강연",
  },
  편재: {
    hanja: "偏財",
    short: "기회와 수완 — 넓게 굴리는 재물의 기운",
    strong: "사업 감각·사교성·통 큰 결정",
    caution: "벌인 일이 많아 산만해질 수 있어요",
    fields: "사업·무역·금융·영업",
  },
  정재: {
    hanja: "正財",
    short: "성실과 관리 — 차곡차곡 쌓는 기운",
    strong: "꼼꼼함·신뢰·안정 지향",
    caution: "지나치면 인색·소심으로 흐를 수 있어요",
    fields: "회계·행정·실무·자산관리",
  },
  편관: {
    hanja: "偏官",
    short: "결단과 카리스마 — 위기를 돌파하는 기운",
    strong: "추진력·담대함·리더십",
    caution: "압박감과 욱하는 마음 다스리기",
    fields: "군경·의료·운동·위기관리",
  },
  정관: {
    hanja: "正官",
    short: "책임과 원칙 — 반듯하게 세우는 기운",
    strong: "성실·신뢰·명예·관리력",
    caution: "완벽주의로 자신을 옥죄지 않기",
    fields: "공직·대기업·관리·법무",
  },
  편인: {
    hanja: "偏印",
    short: "직관과 탐구 — 남다르게 파고드는 기운",
    strong: "통찰·아이디어·순발력",
    caution: "생각 과잉·변덕은 조심",
    fields: "연구·기획·상담·심리",
  },
  정인: {
    hanja: "正印",
    short: "학습과 인덕 — 받쳐주고 배우는 기운",
    strong: "차분함·배려·꾸준한 공부",
    caution: "의존·우유부단으로 흐르지 않기",
    fields: "교육·학문·전문자격·돌봄",
  },
};
