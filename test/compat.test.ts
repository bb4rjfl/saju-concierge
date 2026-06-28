import { describe, it, expect } from "vitest";
import { chartFromBirth } from "../src/engine/chart.js";
import { computeCompatibility } from "../src/engine/compat.js";
import { getCompatibility } from "../src/tools/getCompatibility.js";

const text = (r: { content: { text: string }[] }) => r.content[0]!.text;

describe("computeCompatibility (engine)", () => {
  const a = chartFromBirth({ year: 1990, month: 5, day: 15, hour: 14, minute: 30 }); // 일간 경(금), 말띠(오)
  const b = chartFromBirth({ year: 1992, month: 11, day: 3 }); // 일간 계(수), 원숭이띠(신)

  it("is deterministic and within safe ranges", () => {
    const c1 = computeCompatibility(a, b, "love");
    const c2 = computeCompatibility(a, b, "love");
    expect(c1).toEqual(c2);
    expect(c1.score).toBeGreaterThanOrEqual(40);
    expect(c1.score).toBeLessThanOrEqual(99);
    expect(c1.hearts).toBeGreaterThanOrEqual(1);
    expect(c1.hearts).toBeLessThanOrEqual(5);
  });

  it("is symmetric — same score/hearts/headline regardless of A↔B order", () => {
    const pairs = [
      [{ year: 1990, month: 5, day: 15, hour: 14 }, { year: 1988, month: 7, day: 21 }],
      [{ year: 1995, month: 3, day: 2 }, { year: 2000, month: 1, day: 1 }],
      [{ year: 1972, month: 11, day: 3 }, { year: 2010, month: 12, day: 25 }],
    ] as const;
    for (const [x, y] of pairs) {
      const f = computeCompatibility(chartFromBirth(x), chartFromBirth(y), "love");
      const r = computeCompatibility(chartFromBirth(y), chartFromBirth(x), "love");
      expect(f.score).toBe(r.score);
      expect(f.hearts).toBe(r.hearts);
      expect(f.headline).toBe(r.headline);
    }
  });

  it("reads the day-master element relation (금생수 → 상생)", () => {
    expect(computeCompatibility(a, b).dmRelation).toBe("상생");
  });

  it("reads branch (띠) relations", () => {
    expect(computeCompatibility(a, b).branchRelation).toBe("무난"); // 오 ✕ 신
    // 자(1996 쥐) ✕ 축(1997 소) = 육합
    const rat = chartFromBirth({ year: 1996, month: 6, day: 1 });
    const ox = chartFromBirth({ year: 1997, month: 6, day: 1 });
    expect(computeCompatibility(rat, ox).branchRelation).toBe("육합");
  });

  it("labels relation type from free text", () => {
    expect(computeCompatibility(a, b, "연인").relationLabel).toBe("연인 궁합");
    expect(computeCompatibility(a, b, "친구").relationLabel).toBe("친구 궁합");
    expect(computeCompatibility(a, b).relationLabel).toBe("궁합");
  });
});

describe("getCompatibility tool handler", () => {
  it("renders a shareable card from a code + birth fields", async () => {
    const res = await getCompatibility.handler({
      personA: { profileCode: "SC1|1990-05-15|1430|127|M|-|-" },
      personB: { year: 1992, month: 11, day: 3 },
      relation: "연인",
    });
    const t = text(res as never);
    expect(t).toContain("궁합 카드");
    expect(t).toContain("연인 궁합");
    expect(t).toContain("♥");
    expect(t).toContain("오늘의 기운"); // chip
    expect(t.length).toBeLessThan(24_000);
  });

  it("asks for the partner when only one person is given", async () => {
    const res = await getCompatibility.handler({ personA: { year: 1990, month: 5, day: 15 } });
    expect(text(res as never)).toContain("상대방 생년월일이 필요해요");
  });

  it("asks for both when nothing is given", async () => {
    const res = await getCompatibility.handler({});
    expect(text(res as never)).toContain("두 사람의 생년월일이 필요해요");
  });
});
