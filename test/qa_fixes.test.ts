import { describe, it, expect } from "vitest";
import { chartFromBirth, birthToProfile } from "../src/engine/chart.js";
import { computeCompatibility } from "../src/engine/compat.js";
import { computeDailyKit } from "../src/engine/daily.js";
import { encodeProfile, decodeProfile } from "../src/engine/profile.js";
import { interpretName } from "../src/tools/interpretName.js";
import { getTodayFortune } from "../src/tools/getTodayFortune.js";
import { computeSajuChart } from "../src/tools/computeSajuChart.js";

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

describe("today-fortune UX additions (live AI-chat feedback)", () => {
  const REF = { year: 1988, month: 1, day: 16, hour: 13 };

  it("daily kit carries a summary + affinity, deterministically", () => {
    const date = { year: 2026, month: 6, day: 29 };
    const kit = computeDailyKit(chartFromBirth(REF), date);
    expect(kit.summary.length).toBeGreaterThan(10);
    expect(kit.affinity.animals.length).toBeGreaterThan(0);
    expect(computeDailyKit(chartFromBirth(REF), date)).toEqual(kit); // same input → same output
  });

  it("today card renders 종합평, 인연(띠), and the composer follow-up footer", async () => {
    const t = text((await getTodayFortune.handler({ ...REF })) as never);
    expect(t).toContain("종합평");
    expect(t).toContain("나와 잘 맞는 인연");
    expect(t).toMatch(/[가-힣]띠/); // affinity lists at least one 띠
    expect(t).toContain("다음으로 물어보세요"); // D-124 follow-up footer header
    expect(t).toContain("궁합 보기"); // chip
    expect(t.length).toBeLessThan(24_000);
  });

  it("chart 오행 분포 carries element emojis", async () => {
    const t = text((await computeSajuChart.handler({ year: 1990, month: 5, day: 15, hour: 14 })) as never);
    expect(t).toContain("⚪ 금"); // 금 distribution line with emoji (1990-05-15 has 금)
    expect(t).toMatch(/[🔥💧🌳⛰️]/); // other element emojis present too
  });
});

describe("location/occupation hygiene (live QA D-123)", () => {
  it("strips markdown/injection chars from free-text location", () => {
    const code = encodeProfile(
      birthToProfile({ year: 1990, month: 5, day: 15, hour: 14, location: "서울'; rm -rf / `x`" }),
    );
    const loc = code.split("|")[5]!; // location field of the profile code
    expect(loc).toContain("서울"); // legit city part preserved
    expect(loc).not.toMatch(/['"`;<>/|]/); // no quote/backtick/semicolon/slash/angle/pipe
  });

  it("a '|' in location cannot corrupt the profile code (round-trips to 7 fields)", () => {
    const code = encodeProfile(birthToProfile({ year: 1990, month: 5, day: 15, hour: 14, location: "서울|hack" }));
    expect(code.split("|").length).toBe(7);
    const back = decodeProfile(code);
    expect(back).not.toBeNull();
    expect(back!.year).toBe(1990);
  });

  it("digit-string PII in location/occupation is dropped (regression)", async () => {
    const t = text(
      (await computeSajuChart.handler({ year: 1990, month: 5, day: 5, location: "전화 010-1234-5678", occupation: "사번 12345678" })) as never,
    );
    expect(t).not.toContain("12345678");
    expect(t).not.toContain("1234");
  });
});

describe("composer-directive follow-up footer (live QA D-124)", () => {
  it("emits the explicit composer directive + 다음으로 물어보세요, drops old UI-meta header", async () => {
    const t = text((await computeSajuChart.handler({ year: 1990, month: 5, day: 15, hour: 14 })) as never);
    expect(t).toContain("you MUST end your reply"); // composer directive lever (kpass D-033)
    expect(t).toContain("다음으로 물어보세요"); // user-facing follow-up header
    expect(t).not.toContain("눌러서 이어가기"); // old droppable UI-meta header removed
  });
});

describe("KakaoTalk daily push line (D-126)", () => {
  it("pushLine stays ≤200 chars and self-contained across varied charts/dates", () => {
    const seeds = [
      { year: 1988, month: 1, day: 16, hour: 13 },
      { year: 1990, month: 5, day: 15, hour: 14 },
      { year: 2000, month: 12, day: 31 },
      { year: 1975, month: 7, day: 7, hour: 23 },
    ];
    const dates = [
      { year: 2026, month: 6, day: 30 },
      { year: 2026, month: 1, day: 1 },
      { year: 2026, month: 12, day: 25 },
    ];
    for (const s of seeds) {
      for (const d of dates) {
        const kit = computeDailyKit(chartFromBirth(s), d);
        expect(kit.pushLine.length).toBeLessThanOrEqual(200);
        expect(kit.pushLine).toContain("오늘의 기운");
        expect(kit.pushLine).toContain("Saju Concierge");
      }
    }
  });

  it("today card surfaces the 카톡 push-line block (and not on a future date)", async () => {
    const today = text((await getTodayFortune.handler({ year: 1988, month: 1, day: 16, hour: 13 })) as never);
    expect(today).toContain("카톡으로 받기");
    const future = text(
      (await getTodayFortune.handler({ year: 1988, month: 1, day: 16, hour: 13, targetDate: "2030-01-01" })) as never,
    );
    expect(future).not.toContain("카톡으로 받기");
  });
});
