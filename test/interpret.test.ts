import { describe, it, expect } from "vitest";
import { chartFromBirth } from "../src/engine/chart.js";
import { computeDailyKit } from "../src/engine/daily.js";
import { computeSajuType, computeGodCategories } from "../src/engine/personality.js";
import { getTodayFortune } from "../src/tools/getTodayFortune.js";
import { analyzePersonality } from "../src/tools/analyzePersonality.js";

const text = (r: { content: { text: string }[] }) => r.content[0]!.text;
const REF = { year: 1990, month: 5, day: 15, hour: 14, minute: 30 }; // 경오/신사/경진/계미, 일간 경금

describe("computeSajuType (사주 16유형)", () => {
  const chart = chartFromBirth(REF);

  it("classifies the reference chart deterministically", () => {
    const cats = computeGodCategories(chart);
    // 천간(경·신 비겁, 계 식상) + 지지(오·사 관성, 진·미 인성)
    expect(cats).toEqual({ 비겁: 2, 식상: 1, 재성: 0, 관성: 2, 인성: 2 });
    const t = computeSajuType(chart);
    expect(t.code).toBe("양강절냉"); // 양(경) · 강(support5≥drain3) · 절(식상1<관성2) · 냉(목화2<금수4)
    expect(t.info.name).toBe("원칙의 지휘관");
    expect(t.axes).toHaveLength(4);
  });

  it("always resolves to a defined archetype across many births", () => {
    for (let m = 1; m <= 12; m++) {
      const t = computeSajuType(chartFromBirth({ year: 1988, month: m, day: 10, hour: 9 }));
      expect(t.info).toBeDefined();
      expect(t.info.name.length).toBeGreaterThan(0);
      expect(t.code).toHaveLength(4);
    }
  });
});

describe("computeDailyKit (데일리 럭키 키트)", () => {
  const chart = chartFromBirth(REF); // lacking: 목
  const date = { year: 2026, month: 6, day: 27 };

  it("is deterministic for the same chart + date", () => {
    expect(computeDailyKit(chart, date)).toEqual(computeDailyKit(chart, date));
  });

  it("produces a well-formed kit within safe ranges", () => {
    const kit = computeDailyKit(chart, date);
    expect(kit.score).toBeGreaterThanOrEqual(38);
    expect(kit.score).toBeLessThanOrEqual(98);
    expect(kit.stars).toBeGreaterThanOrEqual(1);
    expect(kit.stars).toBeLessThanOrEqual(5);
    expect(kit.domains).toHaveLength(4);
    expect(kit.dos.length).toBeGreaterThanOrEqual(2);
    expect(kit.donts.length).toBeGreaterThanOrEqual(2);
  });

  it("ties lucky element to the chart's lacking element (목 → 청록색)", () => {
    const kit = computeDailyKit(chart, date);
    expect(kit.favorableElement).toBe("목");
    expect(kit.lucky.color).toBe("청록색");
  });

  it("changes across days (not a constant)", () => {
    const a = computeDailyKit(chart, { year: 2026, month: 6, day: 27 }).score;
    const scores = new Set<number>();
    for (let d = 1; d <= 20; d++) scores.add(computeDailyKit(chart, { year: 2026, month: 6, day: d }).score);
    expect(scores.size).toBeGreaterThan(1); // varies day to day
    expect(a).toBeGreaterThanOrEqual(38);
  });
});

describe("getTodayFortune tool handler", () => {
  it("renders a daily kit with lucky, code, and chips", async () => {
    const res = await getTodayFortune.handler({ ...REF });
    const t = text(res as never);
    expect(t).toContain("오늘의 기운");
    expect(t).toContain("오늘의 럭키");
    expect(t).toContain("SC1|1990-05-15|1430|");
    expect(t).toContain("내일 운세");
    expect(t.length).toBeLessThan(24_000);
  });

  it("reads a specific (future) date from a profile code", async () => {
    const res = await getTodayFortune.handler({
      profileCode: "SC1|1990-05-15|1430|127|M|서울|office",
      targetDate: "2030-01-01",
    });
    expect(text(res as never)).toContain("2030년 1월 1일의 기운");
  });

  it("asks for a birth date gracefully when nothing is given", async () => {
    expect(text((await getTodayFortune.handler({})) as never)).toContain("생년월일이 필요해요");
  });
});

describe("analyzePersonality tool handler", () => {
  it("renders the saju type with code and chips", async () => {
    const res = await analyzePersonality.handler({ ...REF });
    const t = text(res as never);
    expect(t).toContain("사주 유형");
    expect(t).toContain("원칙의 지휘관");
    expect(t).toContain("양강절냉");
    expect(t).toContain("오늘의 기운"); // chip
    expect(t.length).toBeLessThan(24_000);
  });

  it("asks for a birth date gracefully when nothing is given", async () => {
    expect(text((await analyzePersonality.handler({})) as never)).toContain("생년월일이 필요해요");
  });
});
