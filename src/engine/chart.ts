/**
 * 명식 계산 래퍼 — 검증된 MIT 엔진(@fullstackfamily/manseryeok, KASI 데이터)으로
 * 4기둥을 계산하고, 우리 자체 데이터(elements.ts)로 오행 분포·일간·십신·띠를 도출한다.
 * 계산·분류는 결정론적(우리 코드), 표현은 LLM이 담당 (docs/05 3층 파이프라인).
 */
import {
  calculateSaju,
  lunarToSolar,
  solarToLunar,
  isSupportedYear,
  getSupportedRange,
} from "@fullstackfamily/manseryeok";
import {
  STEMS,
  BRANCHES,
  ELEMENTS,
  sipsinOf,
  type Element,
  type YinYang,
  type Sipsin,
} from "./elements.js";
import { cleanText } from "./profile.js";
import type { BirthInput, Profile } from "./profile.js";

export interface Pillar {
  /** 한글 간지 (예: "경오"). */
  name: string;
  /** 한자 간지 (예: "庚午"). */
  hanja: string;
  stem: string;
  branch: string;
  stemElement: Element;
  branchElement: Element;
}

export interface SipsinEntry {
  position: string; // 년간 / 월간 / 시간
  stem: string;
  sipsin: Sipsin;
}

export interface Chart {
  profile: Profile;
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  dayMaster: { stem: string; hanja: string; element: Element; yinYang: YinYang };
  /** 띠 = 년지 동물. */
  animal: string;
  /** 오행 글자 수(천간4 + 지지4; 시 모름이면 6글자). */
  elementCounts: Record<Element, number>;
  /** 가장 많은 오행(동률 가능). */
  dominant: Element[];
  /** 0개인 오행. */
  lacking: Element[];
  /** 일간 제외, 년·월·(시)간의 십신. */
  sipsin: SipsinEntry[];
  isTimeUnknown: boolean;
  timeCorrected?: { hour: number; minute: number };
}

/** 숫자 필드 정규화+범위 검증. 어긋나면 한글 RangeError(호출부가 친절 카드로 변환). */
function reqInt(v: number | undefined | null, label: string, min: number, max: number): number {
  if (v === undefined || v === null || !Number.isFinite(v)) {
    throw new RangeError(`${label} 값을 숫자로 정확히 알려주세요`);
  }
  const n = Math.trunc(v);
  if (n < min || n > max) throw new RangeError(`${label} 값은 ${min}~${max} 사이로 알려주세요`);
  return n;
}

/**
 * 음력→양력 폴백. 라이브러리 `lunarToSolar`가 일부 음력월(특히 12월/섣달)을
 * `Invalid lunar date`로 거부하는 한계가 있어(라이브 QA D-121 확인), 정상 작동하는
 * `solarToLunar`로 해당 음력 연도 구간을 역탐색해 매칭 양력일을 찾는다. 못 찾으면 null
 * (= 실제로 존재하지 않는 음력일). 폴백은 1차 변환 실패 시에만 돈다.
 */
function lunarToSolarScan(
  ly: number,
  lm: number,
  ld: number,
  leap: boolean,
): { year: number; month: number; day: number } | null {
  // 음력 ly년의 달들은 양력 ly년 초 ~ (ly+1)년 초에 걸친다(12월은 다음 양력해로 넘어감).
  const start = new Date(Date.UTC(ly, 0, 1));
  const end = new Date(Date.UTC(ly + 1, 2, 15));
  for (const t = start; t <= end; t.setUTCDate(t.getUTCDate() + 1)) {
    const sy = t.getUTCFullYear();
    const sm = t.getUTCMonth() + 1;
    const sd = t.getUTCDate();
    try {
      const lun = solarToLunar(sy, sm, sd).lunar as {
        year: number;
        month: number;
        day: number;
        isLeapMonth?: boolean;
      };
      if (lun.year === ly && lun.month === lm && lun.day === ld && Boolean(lun.isLeapMonth) === leap) {
        return { year: sy, month: sm, day: sd };
      }
    } catch {
      // 지원 범위 밖/유효하지 않은 양력일은 건너뜀
    }
  }
  return null;
}

/** 사용자 입력(음력/시 모름 포함) → 정규화된 양력 프로필. 잘못된 값은 한글 RangeError. */
export function birthToProfile(input: BirthInput): Profile {
  if (input.year === undefined || input.year === null || !Number.isFinite(input.year)) {
    throw new RangeError("출생 연도를 정확히 알려주세요");
  }
  let year = Math.trunc(input.year);
  let month = reqInt(input.month, "월", 1, 12);
  let day = reqInt(input.day, "일", 1, 31);

  const timeUnknown =
    input.unknownTime === true || input.hour === undefined || input.hour === null;
  const hour = timeUnknown ? null : reqInt(input.hour, "시각", 0, 23);
  const minute = hour === null ? null : input.minute === undefined || input.minute === null ? 0 : reqInt(input.minute, "분", 0, 59);

  if (input.isLunar) {
    if (!isSupportedYear(year)) {
      const r = getSupportedRange();
      throw new RangeError(`지원 연도(${r.min}~${r.max}) 밖이에요`);
    }
    const leap = input.isLeapMonth ?? false;
    let s: { year: number; month: number; day: number } | null = null;
    try {
      s = lunarToSolar(year, month, day, leap).solar;
    } catch {
      // 라이브러리가 못 푸는 음력월(예: 12월/섣달)은 solarToLunar 역탐색으로 폴백.
      s = lunarToSolarScan(year, month, day, leap);
    }
    if (!s) {
      throw new RangeError("음력 날짜를 변환하지 못했어요. 음력 날짜가 맞는지 확인해 주세요");
    }
    year = s.year;
    month = s.month;
    day = s.day;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    gender: input.gender,
    longitude: Number.isFinite(input.longitude) ? (input.longitude as number) : 127,
    location: cleanText(input.location),
    occupation: cleanText(input.occupation),
  };
}

function makePillar(name: string, hanja: string): Pillar {
  const stem = name[0]!;
  const branch = name[1]!;
  return {
    name,
    hanja,
    stem,
    branch,
    stemElement: STEMS[stem]!.element,
    branchElement: BRANCHES[branch]!.element,
  };
}

/** 정규화된 프로필 → 명식. 지원 범위 밖이면 RangeError. */
export function computeChart(profile: Profile): Chart {
  if (!isSupportedYear(profile.year)) {
    const r = getSupportedRange();
    throw new RangeError(`지원 연도(${r.min}~${r.max}) 밖이에요`);
  }

  let saju;
  try {
    saju =
      profile.hour === null
        ? calculateSaju(profile.year, profile.month, profile.day) // 시 모름
        : calculateSaju(profile.year, profile.month, profile.day, profile.hour, profile.minute ?? 0, {
            longitude: profile.longitude,
            applyTimeCorrection: true,
          });
  } catch {
    throw new RangeError("존재하지 않는 날짜예요. 날짜(특히 '일')를 다시 확인해 주세요");
  }

  const year = makePillar(saju.yearPillar, saju.yearPillarHanja);
  const month = makePillar(saju.monthPillar, saju.monthPillarHanja);
  const day = makePillar(saju.dayPillar, saju.dayPillarHanja);
  const hour =
    saju.hourPillar && saju.hourPillarHanja
      ? makePillar(saju.hourPillar, saju.hourPillarHanja)
      : null;

  const dmStem = day.stem;
  const dmInfo = STEMS[dmStem]!;

  const elementCounts: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const usedPillars = [year, month, day, ...(hour ? [hour] : [])];
  for (const p of usedPillars) {
    elementCounts[p.stemElement]++;
    elementCounts[p.branchElement]++;
  }

  const max = Math.max(...ELEMENTS.map((e) => elementCounts[e]));
  const dominant = ELEMENTS.filter((e) => elementCounts[e] === max && max > 0);
  const lacking = ELEMENTS.filter((e) => elementCounts[e] === 0);

  const sipsinSources = [
    { position: "년간", stem: year.stem },
    { position: "월간", stem: month.stem },
    ...(hour ? [{ position: "시간", stem: hour.stem }] : []),
  ];
  const sipsin: SipsinEntry[] = sipsinSources.map((s) => {
    const info = STEMS[s.stem]!;
    return {
      position: s.position,
      stem: s.stem,
      sipsin: sipsinOf(dmInfo.element, dmInfo.yinYang, info.element, info.yinYang),
    };
  });

  return {
    profile,
    pillars: { year, month, day, hour },
    dayMaster: { stem: dmStem, hanja: dmInfo.hanja, element: dmInfo.element, yinYang: dmInfo.yinYang },
    animal: BRANCHES[year.branch]!.animal,
    elementCounts,
    dominant,
    lacking,
    sipsin,
    isTimeUnknown: hour === null,
    timeCorrected:
      saju.isTimeCorrected && saju.correctedTime ? saju.correctedTime : undefined,
  };
}

/** 입력 → 명식 (편의 함수). */
export function chartFromBirth(input: BirthInput): Chart {
  return computeChart(birthToProfile(input));
}
