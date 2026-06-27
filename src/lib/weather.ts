/**
 * 키 없는 날씨·미세먼지 보강 — Open-Meteo (무료·무키, 데이터 CC BY 4.0, 비상업 한정).
 * (D-109) getTodayFortune의 "데일리 처방"에 best-effort로 덧붙인다. 외부 호출이지만:
 *  - 위치가 주어졌을 때만 호출, 2.5s 타임아웃, 실패하면 null → 운세는 정상 출력(절대 안 막음).
 *  - 키가 없으므로 KC 환경변수 문제 없음(우리 무키 강점 유지).
 *  - 테스트 환경(NODE_ENV=test)에선 네트워크 호출을 건너뛴다(빠르고 결정론적).
 */
import { EXTERNAL_API_TIMEOUT_MS } from "./constants.js";

export interface WeatherInfo {
  tempC: number;
  sky: string;
  pm10?: number;
  pm25?: number;
  pm10Label?: string;
  pm25Label?: string;
}

// WMO weather_code → 한국어 간단 라벨.
const SKY: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "안개",
  51: "이슬비",
  53: "이슬비",
  55: "이슬비",
  61: "비",
  63: "비",
  65: "강한 비",
  71: "눈",
  73: "눈",
  75: "강한 눈",
  80: "소나기",
  81: "소나기",
  82: "강한 소나기",
  95: "천둥번개",
  96: "천둥번개",
  99: "천둥번개",
};

function skyLabel(code: unknown): string {
  return (typeof code === "number" && SKY[code]) || "흐림";
}
function aqiPm25(v: number): string {
  return v <= 15 ? "좋음" : v <= 35 ? "보통" : v <= 75 ? "나쁨" : "매우 나쁨";
}
function aqiPm10(v: number): string {
  return v <= 30 ? "좋음" : v <= 80 ? "보통" : v <= 150 ? "나쁨" : "매우 나쁨";
}

/**
 * 한국 주요 도시/지역 → 좌표(중심부 근사). Open-Meteo 지오코딩이 한글명을 잘 못 찾으므로
 * 로컬 테이블로 바로 좌표를 얻는다(외부 호출 1번 절약 + 안정적). 부분일치(서울특별시 강남구 → 서울).
 */
const CITY_COORDS: Record<string, [number, number]> = {
  서울: [37.5665, 126.978],
  부산: [35.1796, 129.0756],
  대구: [35.8714, 128.6014],
  인천: [37.4563, 126.7052],
  광주: [35.1595, 126.8526],
  대전: [36.3504, 127.3845],
  울산: [35.5384, 129.3114],
  세종: [36.48, 127.289],
  제주: [33.4996, 126.5312],
  수원: [37.2636, 127.0286],
  성남: [37.42, 127.1267],
  용인: [37.2411, 127.1776],
  고양: [37.6584, 126.832],
  부천: [37.5035, 126.766],
  안양: [37.3943, 126.9568],
  청주: [36.6424, 127.489],
  천안: [36.8151, 127.1139],
  전주: [35.8242, 127.148],
  포항: [36.019, 129.3435],
  창원: [35.228, 128.6811],
  김해: [35.2342, 128.8894],
  춘천: [37.8813, 127.73],
  강릉: [37.7519, 128.8761],
  원주: [37.3422, 127.9202],
  경주: [35.8562, 129.2247],
  목포: [34.8118, 126.3922],
  여수: [34.7604, 127.6622],
  안산: [37.3219, 126.8309],
  평택: [36.9921, 127.1129],
  남양주: [37.636, 127.2165],
  강남: [37.4979, 127.0276],
  해운대: [35.1631, 129.1639],
  판교: [37.3947, 127.1112],
};

function coordsFor(location: string): [number, number] | null {
  const s = location.replace(/\s/g, "");
  for (const [k, v] of Object.entries(CITY_COORDS)) if (s.includes(k)) return v;
  return null;
}

async function getJson(url: string, signal: AbortSignal): Promise<any> {
  try {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** 위치명(한국 도시/구) → 현재 날씨+대기질. 실패 시 null(운세를 막지 않음). */
export async function fetchWeather(location: string): Promise<WeatherInfo | null> {
  if (!location || process.env.NODE_ENV === "test") return null;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), EXTERNAL_API_TIMEOUT_MS);
  try {
    let latitude: number;
    let longitude: number;
    const local = coordsFor(location);
    if (local) {
      [latitude, longitude] = local;
    } else {
      // 테이블에 없으면 지오코딩 폴백(영문명 등에 유효).
      const geo = await getJson(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=ko&format=json`,
        ac.signal,
      );
      const place = geo?.results?.[0];
      if (!place || typeof place.latitude !== "number") return null;
      latitude = place.latitude;
      longitude = place.longitude;
    }

    const [wx, air] = await Promise.all([
      getJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Asia%2FSeoul`,
        ac.signal,
      ),
      getJson(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5&timezone=Asia%2FSeoul`,
        ac.signal,
      ),
    ]);

    const cur = wx?.current;
    if (!cur || typeof cur.temperature_2m !== "number") return null;
    const info: WeatherInfo = { tempC: Math.round(cur.temperature_2m), sky: skyLabel(cur.weather_code) };

    const aq = air?.current;
    if (aq && typeof aq.pm10 === "number") {
      info.pm10 = Math.round(aq.pm10);
      info.pm10Label = aqiPm10(aq.pm10);
    }
    if (aq && typeof aq.pm2_5 === "number") {
      info.pm25 = Math.round(aq.pm2_5);
      info.pm25Label = aqiPm25(aq.pm2_5);
    }
    return info;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 날씨 정보를 한 줄 Markdown으로. 출처(Open-Meteo) 표기. */
export function weatherLine(w: WeatherInfo, location: string): string {
  const air = w.pm10Label ? ` · 미세먼지 ${w.pm10Label}${w.pm25Label ? `/초미세 ${w.pm25Label}` : ""}` : "";
  return `🌤️ **오늘 ${location}**: ${w.tempC}°C ${w.sky}${air} _(Open-Meteo)_`;
}
