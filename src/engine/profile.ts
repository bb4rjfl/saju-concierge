/**
 * 프로필 코드 — stateless 우회의 핵심 (docs/04 §2).
 *
 * 명식을 세션에 들고 다닐 수 없으므로, 응답에 짧은 "프로필 코드"를 실어 사용자가
 * 코드만 들고 다니며 후속 툴에 그대로 넣게 한다 → 재입력 0, 서버 저장 0.
 *
 * 코드에는 (음력은 양력으로 변환한) **양력 생년월일시 + 경도 + 선택 성별/위치/직업**만
 * 담는다. 서버에 저장하지 않으며, 개인정보 6종(주민/면허/여권/외국인등록/카드/계좌)을
 * 포함하지 않는다. 생년월일은 사용자가 직접 들고 다니는 값일 뿐이다.
 */

export type Gender = "M" | "F";

/** 사용자가 처음 입력하는 형태(음력/시 모름 등 허용). */
export interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  isLunar?: boolean;
  isLeapMonth?: boolean;
  gender?: Gender;
  /** true면 시주를 비우는 "시 모름" 모드. hour 미입력도 동일 처리. */
  unknownTime?: boolean;
  /** 진태양시 보정 경도(기본 127, 서울). */
  longitude?: number;
  /** 선택: 날씨/미세먼지 보강용 도시·구 (예: "서울"). */
  location?: string;
  /** 선택: 맞춤 do/don'ts용 생활 맥락 (예: "student"/"office"). */
  occupation?: string;
}

/** 정규화된 양력 프로필(코드로 인코딩되는 canonical 형태). */
export interface Profile {
  year: number;
  month: number;
  day: number;
  /** null = 시 모름. */
  hour: number | null;
  minute: number | null;
  gender?: Gender;
  longitude: number;
  location?: string;
  occupation?: string;
}

const CODE_VERSION = "SC1";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 코드 구분자(|)와 줄바꿈만 제거. 한글은 그대로 유지(읽기 쉬움). */
function sanitize(s?: string): string {
  if (!s) return "-";
  const cleaned = s.replace(/[|\r\n]/g, " ").trim().slice(0, 24);
  return cleaned.length > 0 ? cleaned : "-";
}

/** 정규화된 프로필 → 사람이 읽을 수 있는 프로필 코드 문자열. */
export function encodeProfile(p: Profile): string {
  const date = `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
  const time = p.hour === null ? "----" : `${pad2(p.hour)}${pad2(p.minute ?? 0)}`;
  return [
    CODE_VERSION,
    date,
    time,
    String(p.longitude),
    p.gender ?? "-",
    sanitize(p.location),
    sanitize(p.occupation),
  ].join("|");
}

/** 프로필 코드 → 프로필. 형식이 어긋나면 null(호출부에서 친절히 폴백). */
export function decodeProfile(code: string): Profile | null {
  const parts = code.trim().split("|");
  if (parts[0] !== CODE_VERSION || parts.length < 5) return null;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts[1] ?? "");
  if (!dateMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  const t = parts[2] ?? "----";
  let hour: number | null = null;
  let minute: number | null = null;
  if (/^\d{4}$/.test(t)) {
    hour = Number(t.slice(0, 2));
    minute = Number(t.slice(2, 4));
  }

  const longitude = Number(parts[3]);
  if (!Number.isFinite(longitude)) return null;

  const g = parts[4];
  const gender: Gender | undefined = g === "M" || g === "F" ? g : undefined;

  const loc = parts[5] && parts[5] !== "-" ? parts[5] : undefined;
  const job = parts[6] && parts[6] !== "-" ? parts[6] : undefined;

  return { year, month, day, hour, minute, gender, longitude, location: loc, occupation: job };
}

/** "남"/"male"/"m" 등 자유 입력을 M/F로 정규화 (z.enum 회피 — docs/09 §6). */
export function normalizeGender(raw?: string): Gender | undefined {
  if (!raw) return undefined;
  const s = raw.trim().toLowerCase();
  if (["m", "male", "남", "남자", "man", "boy"].includes(s)) return "M";
  if (["f", "female", "여", "여자", "woman", "girl"].includes(s)) return "F";
  return undefined;
}
