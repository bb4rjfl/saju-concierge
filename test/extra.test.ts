import { describe, it, expect } from "vitest";
import { chartFromBirth } from "../src/engine/chart.js";
import { computeYearlyFortune } from "../src/engine/yearly.js";
import { readName } from "../src/engine/name.js";
import { getYearlyFortune } from "../src/tools/getYearlyFortune.js";
import { interpretName } from "../src/tools/interpretName.js";
import { getTodayFortune } from "../src/tools/getTodayFortune.js";

const text = (r: { content: { text: string }[] }) => r.content[0]!.text;
const REF = { year: 1990, month: 5, day: 15, hour: 14, minute: 30 };

describe("computeYearlyFortune", () => {
  const chart = chartFromBirth(REF);
  it("is deterministic with valid structure", () => {
    const y1 = computeYearlyFortune(chart, 2026);
    expect(y1).toEqual(computeYearlyFortune(chart, 2026));
    expect(y1.score).toBeGreaterThanOrEqual(42);
    expect(y1.score).toBeLessThanOrEqual(97);
    expect(y1.seasons).toHaveLength(4);
    expect(y1.keywords).toHaveLength(3);
    expect(y1.yearGanji.length).toBeGreaterThanOrEqual(2);
  });
});

describe("readName (한글 음 오행)", () => {
  it("maps initial consonants to elements and reads the flow (김민수 → 상생)", () => {
    const r = readName("김민수"); // 김 ㄱ→목, 민 ㅁ→수, 수 ㅅ→금
    expect(r.syllables.map((s) => s.element)).toEqual(["목", "수", "금"]);
    expect(r.counts).toEqual({ 목: 1, 화: 0, 토: 0, 금: 1, 수: 1 });
    expect(r.flowKind).toBe("상생"); // 수생목·금생수
  });
  it("handles a single syllable", () => {
    expect(readName("강").flowKind).toBe("단일");
  });
});

describe("new tool handlers + share card", () => {
  it("getYearlyFortune renders with a share card", async () => {
    const res = await getYearlyFortune.handler({ ...REF, targetYear: 2026 });
    const t = text(res as never);
    expect(t).toContain("2026년 운세");
    expect(t).toContain("공유하기");
    expect(t).toContain("올해 내 운세 봐줘"); // recipient CTA
    expect(t.length).toBeLessThan(24_000);
  });

  it("interpretName renders a reading with a share card", async () => {
    const res = await interpretName.handler({ name: "김민수" });
    const t = text(res as never);
    expect(t).toContain("이름풀이");
    expect(t).toContain("김민수");
    expect(t).toContain("공유하기");
    expect(t.length).toBeLessThan(24_000);
  });

  it("interpretName asks for a Korean name when missing", async () => {
    expect(text((await interpretName.handler({})) as never)).toContain("한글 이름이 필요해요");
  });

  it("every result carries the viral hook (service name + try phrase)", async () => {
    const t = text((await getTodayFortune.handler({ ...REF })) as never);
    expect(t).toContain("Saju Concierge");
    expect(t).toContain("나도 보고 싶다면");
    expect(t).toContain("오늘 내 운세 봐줘");
  });
});
