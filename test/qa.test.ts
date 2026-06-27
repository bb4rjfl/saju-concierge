import { describe, it, expect } from "vitest";
import { computeSajuChart } from "../src/tools/computeSajuChart.js";
import { getTodayFortune } from "../src/tools/getTodayFortune.js";
import { getYearlyFortune } from "../src/tools/getYearlyFortune.js";
import { interpretName } from "../src/tools/interpretName.js";
import { findAuspiciousDate } from "../src/tools/findAuspiciousDate.js";

const text = (r: { content: { text: string }[] }) => r.content[0]!.text;
const REF = { year: 1990, month: 5, day: 15, hour: 14, minute: 30 };

describe("QA regressions — no raw errors, graceful fallbacks", () => {
  it("out-of-range month → friendly Korean card (no raw Zod/-32602)", async () => {
    const t = text((await computeSajuChart.handler({ year: 1995, month: 13, day: 5 })) as never);
    expect(t).toContain("1~12");
    expect(t).not.toContain("Invalid");
    expect(t).not.toContain("too_big");
  });

  it("impossible calendar date (Feb 30) → Korean message, not engine English", async () => {
    const t = text((await computeSajuChart.handler({ year: 1995, month: 2, day: 30 })) as never);
    expect(t).toContain("존재하지 않는 날짜");
    expect(t).not.toContain("Invalid solar date");
  });

  it("string-typed numbers are coerced (LLM sends '1990')", async () => {
    const t = text((await computeSajuChart.handler({ year: "1990", month: "5", day: "15" } as never)) as never);
    expect(t).toContain("명식");
    expect(t).toContain("말띠");
  });

  it("PII-shaped location/occupation is NOT echoed into the profile code", async () => {
    const t = text(
      (await computeSajuChart.handler({
        year: 1990,
        month: 5,
        day: 5,
        location: "주민번호 900101-1234567",
        occupation: "카드 4111111111111111",
      })) as never,
    );
    expect(t).not.toContain("1234567");
    expect(t).not.toContain("4111111111111111");
  });

  it("absurdly long name is capped (no 24k bloat)", async () => {
    const t = text((await interpretName.handler({ name: "김".repeat(2000) })) as never);
    expect(t.length).toBeLessThan(2000);
  });

  it("float year is truncated and rendered", async () => {
    const t = text((await getYearlyFortune.handler({ ...REF, targetYear: 2026.7 })) as never);
    expect(t).toContain("2026년");
  });

  it("bad targetDate → today with a notice", async () => {
    const t = text((await getTodayFortune.handler({ ...REF, targetDate: "2026-13-40" })) as never);
    expect(t).toContain("못 읽어");
  });

  it("bad searchMonth → 60-day fallback with a notice", async () => {
    const t = text((await findAuspiciousDate.handler({ ...REF, searchMonth: "2026-13" })) as never);
    expect(t).toContain("못 읽어");
  });

  it("general auspicious title is not duplicated ('좋은 날 좋은 날')", async () => {
    const t = text((await findAuspiciousDate.handler({ ...REF })) as never);
    expect(t).not.toContain("좋은 날 좋은 날");
    expect(t).toContain("운수 좋은 날");
  });
});
