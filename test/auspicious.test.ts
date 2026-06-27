import { describe, it, expect } from "vitest";
import { chartFromBirth } from "../src/engine/chart.js";
import { computeAuspiciousDates, normalizePurpose } from "../src/engine/auspicious.js";
import { findAuspiciousDate } from "../src/tools/findAuspiciousDate.js";

const text = (r: { content: { text: string }[] }) => r.content[0]!.text;
const REF = { year: 1990, month: 5, day: 15, hour: 14, minute: 30 };

describe("normalizePurpose", () => {
  it("maps free text to purpose", () => {
    expect(normalizePurpose("이사 가려고").label).toBe("이사");
    expect(normalizePurpose("결혼식").label).toBe("결혼");
    expect(normalizePurpose("개업할 거야").label).toBe("개업·계약");
    expect(normalizePurpose("그냥").key).toBe("general");
  });
});

describe("computeAuspiciousDates", () => {
  const chart = chartFromBirth(REF);
  const from = { year: 2026, month: 8, day: 1 };
  const to = { year: 2026, month: 8, day: 31 };

  it("is deterministic and returns sorted top-N within range", () => {
    const r1 = computeAuspiciousDates(chart, "이사", from, to, 3);
    expect(r1).toEqual(computeAuspiciousDates(chart, "이사", from, to, 3));
    expect(r1.days.length).toBe(3);
    expect(r1.scanned).toBe(31);
    // sorted by score desc
    expect(r1.days[0]!.score).toBeGreaterThanOrEqual(r1.days[1]!.score);
    for (const d of r1.days) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(d.dayGanji.length).toBeGreaterThanOrEqual(2);
      expect(d.date.month).toBe(8);
    }
  });

  it("flags 손 없는 날 on lunar days ending in 9 or 0", () => {
    const r = computeAuspiciousDates(chart, "이사", from, to, 7);
    for (const d of r.days) {
      if (d.sonEopsNeunNal) expect([9, 10, 19, 20, 29, 30]).toContain(d.lunarDay);
    }
  });
});

describe("findAuspiciousDate tool handler", () => {
  it("renders a ranked list with a share card for a given month", async () => {
    const res = await findAuspiciousDate.handler({ ...REF, purpose: "이사", searchMonth: "2026-08" });
    const t = text(res as never);
    expect(t).toContain("이사 좋은 날");
    expect(t).toContain("공유하기");
    expect(t).toContain("오늘의 기운"); // chip back to retention feature
    expect(t.length).toBeLessThan(24_000);
  });

  it("asks for a birth date when missing", async () => {
    expect(text((await findAuspiciousDate.handler({})) as never)).toContain("생년월일이 필요해요");
  });
});
