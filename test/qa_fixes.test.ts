import { describe, it, expect } from "vitest";
import { chartFromBirth } from "../src/engine/chart.js";
import { computeCompatibility } from "../src/engine/compat.js";
import { interpretName } from "../src/tools/interpretName.js";

const text = (r: { content: { text: string }[] }) => r.content[0]!.text;

describe("interpretName PII hygiene (live QA F-7)", () => {
  it("strips digits/symbols and interprets only the Hangul part", () => {
    const t = text(interpretName.handler({ name: "김민수010-1234-5678" }) as never);
    expect(t).toContain("이름풀이 — 김민수");
    expect(t).not.toMatch(/[0-9]/); // no digit echoed anywhere in the card
    expect(t).not.toContain("(–)"); // no "unknown char" placeholders
  });

  it("does not echo an RRN-shaped fragment", () => {
    const t = text(interpretName.handler({ name: "홍길동901231-1234567" }) as never);
    expect(t).toContain("이름풀이 — 홍길동");
    expect(t).not.toContain("901231");
    expect(t).not.toMatch(/[0-9]/);
  });

  it("pure non-Hangul (digits only) → friendly Korean error", () => {
    const t = text(interpretName.handler({ name: "12345" }) as never);
    expect(t).toContain("한글 이름이 필요해요");
  });

  it("Hangul mixed with latin still works, the latin is dropped (not echoed)", () => {
    const t = text(interpretName.handler({ name: "abc김하늘xyz" }) as never);
    expect(t).toContain("이름풀이 — 김하늘"); // clean title
    expect(t).not.toContain("abc"); // input latin not reflected back
    expect(t).not.toContain("xyz");
  });
});

describe("compatibility heart spread (live QA F-5)", () => {
  const seeds = [
    { year: 1990, month: 5, day: 15, hour: 14 },
    { year: 1991, month: 12, day: 25, hour: 20 },
    { year: 1988, month: 7, day: 21, hour: 9 },
    { year: 1995, month: 3, day: 2, hour: 3 },
    { year: 2000, month: 1, day: 1, hour: 0 },
    { year: 1972, month: 11, day: 3, hour: 16 },
    { year: 2010, month: 12, day: 25, hour: 6 },
    { year: 1985, month: 6, day: 6, hour: 12 },
    { year: 1999, month: 6, day: 6, hour: 23 },
    { year: 2000, month: 12, day: 12, hour: 0 },
  ];

  it("produces a meaningful range — 5♥ reachable and ≤3♥ exists", () => {
    const hearts = new Set<number>();
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        const c = computeCompatibility(chartFromBirth(seeds[i]!), chartFromBirth(seeds[j]!), "love");
        expect(c.hearts).toBeGreaterThanOrEqual(1);
        expect(c.hearts).toBeLessThanOrEqual(5);
        hearts.add(c.hearts);
      }
    }
    expect(Math.max(...hearts)).toBeGreaterThanOrEqual(5); // great matches can hit 5♥
    expect(Math.min(...hearts)).toBeLessThanOrEqual(3); // weaker matches dip to ≤3♥
    expect(hearts.size).toBeGreaterThanOrEqual(3); // genuine spread, not all clustered
  });

  it("hearts stay symmetric under A↔B swap", () => {
    const x = chartFromBirth(seeds[0]!);
    const y = chartFromBirth(seeds[1]!);
    expect(computeCompatibility(x, y, "love").hearts).toBe(computeCompatibility(y, x, "love").hearts);
  });
});

describe("lunar 음력 12월 (섣달) conversion fallback (live QA D-121)", () => {
  it("converts 음력 2021-12-15 → solar 2022-01-17 (library rejects, fallback resolves)", () => {
    const c = chartFromBirth({ year: 2021, month: 12, day: 15, isLunar: true, unknownTime: true });
    expect(c.profile.year).toBe(2022);
    expect(c.profile.month).toBe(1);
    expect(c.profile.day).toBe(17);
  });

  it("converts 음력 1990-12-28 (섣달) without throwing → early solar 1991", () => {
    const c = chartFromBirth({ year: 1990, month: 12, day: 28, isLunar: true, unknownTime: true });
    expect(c.profile.year).toBe(1991);
  });

  it("normal lunar months still go through the primary path (음력 2021-11-15 → 2021-12-18)", () => {
    const c = chartFromBirth({ year: 2021, month: 11, day: 15, isLunar: true, unknownTime: true });
    expect(c.profile.year).toBe(2021);
    expect(c.profile.month).toBe(12);
    expect(c.profile.day).toBe(18);
  });

  it("a genuinely nonexistent lunar date (음력 2021-12-30, month has 29 days) still errors", () => {
    expect(() =>
      chartFromBirth({ year: 2021, month: 12, day: 30, isLunar: true, unknownTime: true }),
    ).toThrow();
  });
});
