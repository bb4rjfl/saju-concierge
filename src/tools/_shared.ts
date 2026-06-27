/**
 * 차트가 필요한 모든 툴이 공유하는 입력 스키마 + 차트 해석 헬퍼.
 * (computeSajuChart / getTodayFortune / analyzePersonality / … 공통)
 *
 * 모든 필드 optional → 빠진 값은 raw -32602 대신 *친절히* 폴백(호출부가 안내 카드).
 * z.enum 미사용(자유 입력 정규화 — docs/09 §6).
 */
import { z } from "zod";
import { birthToProfile, computeChart, type Chart } from "../engine/chart.js";
import { decodeProfile, normalizeGender, type BirthInput } from "../engine/profile.js";

export const birthShape = {
  profileCode: z
    .string()
    .optional()
    .describe(
      "A previously issued Saju Concierge profile code (starts with 'SC1|'). If given, birth fields are ignored and the chart is recomputed from it — no re-entry needed.",
    ),
  year: z
    .number()
    .int()
    .optional()
    .describe("Birth year, solar unless isLunar=true. 1900–2050. Required unless profileCode is given."),
  month: z.number().int().min(1).max(12).optional().describe("Birth month 1–12."),
  day: z.number().int().min(1).max(31).optional().describe("Birth day 1–31."),
  hour: z
    .number()
    .int()
    .min(0)
    .max(23)
    .optional()
    .describe("Birth hour 0–23 (24h). Omit for the 'unknown time' (시 모름) mode."),
  minute: z.number().int().min(0).max(59).optional().describe("Birth minute 0–59. Default 0."),
  isLunar: z.boolean().optional().describe("True if the date is a lunar (음력) date. Default false."),
  isLeapMonth: z.boolean().optional().describe("True if the lunar month is a leap month (윤달)."),
  unknownTime: z.boolean().optional().describe("Force 'unknown time' mode even if hour is provided."),
  gender: z.string().optional().describe("Free text like 'M'/'F'/'남'/'여' — normalized internally."),
  location: z
    .string()
    .optional()
    .describe("Optional city/district (e.g. '서울') carried for later weather enrichment."),
  occupation: z
    .string()
    .optional()
    .describe("Optional life context (e.g. 'student'/'office') carried for tailored daily advice."),
  longitude: z.number().optional().describe("Longitude for true-solar-time correction. Default 127 (Seoul)."),
};

/**
 * 입력(프로필 코드 우선, 없으면 생년월일) → 명식. 둘 다 없으면 null(호출부가 안내).
 * 지원 범위 밖/음력 변환 실패는 RangeError를 던지므로 호출부에서 try/catch.
 */
export function resolveChart(args: Record<string, unknown>): Chart | null {
  const a = z.object(birthShape).parse(args);

  if (a.profileCode) {
    const decoded = decodeProfile(a.profileCode);
    if (decoded) return computeChart(decoded);
  }

  if (a.year && a.month && a.day) {
    const input: BirthInput = {
      year: a.year,
      month: a.month,
      day: a.day,
      hour: a.hour,
      minute: a.minute,
      isLunar: a.isLunar,
      isLeapMonth: a.isLeapMonth,
      unknownTime: a.unknownTime,
      gender: normalizeGender(a.gender),
      location: a.location,
      occupation: a.occupation,
      longitude: a.longitude,
    };
    return computeChart(birthToProfile(input));
  }

  return null;
}

/** 생년월일이 없을 때 모든 툴이 같은 문구로 안내. */
export const BIRTH_PROMPT_TITLE = "생년월일이 필요해요";
export const BIRTH_PROMPT_DETAIL =
  "예: `1990년 5월 15일 오후 2시 30분생` 처럼 알려주세요. 시각을 모르면 빼고 말해도 돼요(시 모름 모드). 음력이면 음력이라고 알려주세요. 이미 사주 코드(`SC1|…`)가 있다면 그대로 넣어도 돼요.";
