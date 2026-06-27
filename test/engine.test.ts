import { describe, it, expect } from "vitest";
import { chartFromBirth, computeChart, birthToProfile } from "../src/engine/chart.js";
import { encodeProfile, decodeProfile } from "../src/engine/profile.js";
import { sipsinOf, generates, controls } from "../src/engine/elements.js";
import { computeSajuChart } from "../src/tools/computeSajuChart.js";

/** Reference values verified against the manseryeok README example:
 *  calculateSaju(1990,5,15,14,30) → 경오 / 신사 / 경진 / 계미. */
describe("computeChart — known reference (1990-05-15 14:30)", () => {
  const chart = chartFromBirth({ year: 1990, month: 5, day: 15, hour: 14, minute: 30 });

  it("computes the four pillars", () => {
    expect(chart.pillars.year.name).toBe("경오");
    expect(chart.pillars.month.name).toBe("신사");
    expect(chart.pillars.day.name).toBe("경진");
    expect(chart.pillars.hour?.name).toBe("계미");
  });

  it("derives the day master (일간) and zodiac animal (띠)", () => {
    expect(chart.dayMaster.stem).toBe("경");
    expect(chart.dayMaster.element).toBe("금");
    expect(chart.dayMaster.yinYang).toBe("양");
    expect(chart.animal).toBe("말");
  });

  it("computes the five-element distribution over 8 chars", () => {
    expect(chart.elementCounts).toEqual({ 목: 0, 화: 2, 토: 2, 금: 3, 수: 1 });
    expect(chart.dominant).toEqual(["금"]);
    expect(chart.lacking).toEqual(["목"]);
  });

  it("computes 십신 for year/month/hour stems relative to the day master", () => {
    const byPos = Object.fromEntries(chart.sipsin.map((s) => [s.position, s.sipsin]));
    expect(byPos["년간"]).toBe("비견"); // 경(금양) vs 경(금양)
    expect(byPos["월간"]).toBe("겁재"); // 신(금음) vs 경(금양)
    expect(byPos["시간"]).toBe("상관"); // 계(수음): 금생수(아생), 음양 다름
  });
});

describe("시 모름 (unknown time) mode", () => {
  const chart = chartFromBirth({ year: 1990, month: 5, day: 15 });
  it("leaves the hour pillar empty and counts only 6 chars", () => {
    expect(chart.isTimeUnknown).toBe(true);
    expect(chart.pillars.hour).toBeNull();
    expect(chart.elementCounts).toEqual({ 목: 0, 화: 2, 토: 1, 금: 3, 수: 0 });
    expect(chart.lacking).toEqual(["목", "수"]);
  });
});

describe("입춘(立春) year boundary handled by the engine", () => {
  it("before 입춘 → previous year pillar", () => {
    expect(chartFromBirth({ year: 1984, month: 2, day: 2 }).pillars.year.name).toBe("계해");
  });
  it("on/after 입춘 → new year pillar", () => {
    expect(chartFromBirth({ year: 1984, month: 2, day: 4 }).pillars.year.name).toBe("갑자");
  });
});

describe("five-element relations", () => {
  it("생(generates) follows 목→화→토→금→수→목", () => {
    expect(generates("목", "화")).toBe(true);
    expect(generates("금", "수")).toBe(true);
    expect(generates("수", "목")).toBe(true);
    expect(generates("목", "토")).toBe(false);
  });
  it("극(controls) follows 목극토·화극금·토극수·금극목·수극화", () => {
    expect(controls("목", "토")).toBe(true);
    expect(controls("수", "화")).toBe(true);
    expect(controls("목", "화")).toBe(false);
  });
  it("sipsin polarity rules", () => {
    expect(sipsinOf("금", "양", "금", "양")).toBe("비견");
    expect(sipsinOf("금", "양", "금", "음")).toBe("겁재");
    expect(sipsinOf("금", "양", "수", "음")).toBe("상관");
    expect(sipsinOf("금", "양", "수", "양")).toBe("식신");
    expect(sipsinOf("금", "양", "목", "음")).toBe("정재"); // 금극목(아극), 음양 다름
    expect(sipsinOf("금", "양", "화", "양")).toBe("편관"); // 화극금(극아), 음양 같음
    expect(sipsinOf("금", "양", "토", "음")).toBe("정인"); // 토생금(생아), 음양 다름
  });
});

describe("profile code round-trip (stateless reuse)", () => {
  it("encodes and decodes losslessly, recomputing the same chart", () => {
    const profile = birthToProfile({
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      gender: "M",
      location: "서울",
      occupation: "office",
    });
    const code = encodeProfile(profile);
    expect(code.startsWith("SC1|")).toBe(true);
    const decoded = decodeProfile(code);
    expect(decoded).toEqual(profile);
    expect(computeChart(decoded!).pillars.day.name).toBe("경진");
  });

  it("encodes 시 모름 with a placeholder time", () => {
    const profile = birthToProfile({ year: 2000, month: 1, day: 1 });
    const code = encodeProfile(profile);
    expect(code).toContain("|----|");
    expect(decodeProfile(code)?.hour).toBeNull();
  });

  it("rejects malformed codes", () => {
    expect(decodeProfile("nope")).toBeNull();
    expect(decodeProfile("SC1|bad|----|127|-")).toBeNull();
  });
});

describe("range guard", () => {
  it("throws for years outside 1900–2050", () => {
    expect(() => chartFromBirth({ year: 1800, month: 1, day: 1 })).toThrow();
  });
});

describe("computeSajuChart tool handler", () => {
  const text = (r: { content: { text: string }[] }) => r.content[0]!.text;

  it("renders a chart from birth fields with a profile code and chips", async () => {
    const res = await computeSajuChart.handler({ year: 1990, month: 5, day: 15, hour: 14, minute: 30 });
    const t = text(res as never);
    expect(t).toContain("경오");
    expect(t).toContain("말띠");
    expect(t).toContain("SC1|1990-05-15|1430|");
    expect(t).toContain("오늘의 기운");
    expect(t.length).toBeLessThan(24_000);
  });

  it("recomputes from a profile code", async () => {
    const res = await computeSajuChart.handler({ profileCode: "SC1|1990-05-15|1430|127|M|서울|office" });
    expect(text(res as never)).toContain("경진");
  });

  it("asks for a birth date gracefully when nothing is given (no raw error)", async () => {
    const res = await computeSajuChart.handler({});
    expect(text(res as never)).toContain("생년월일이 필요해요");
  });
});
