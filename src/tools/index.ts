import type { ToolDef } from "./types.js";
import { computeSajuChart } from "./computeSajuChart.js";
import { getTodayFortune } from "./getTodayFortune.js";
import { analyzePersonality } from "./analyzePersonality.js";
import { getCompatibility } from "./getCompatibility.js";
import { getYearlyFortune } from "./getYearlyFortune.js";
import { interpretName } from "./interpretName.js";
import { findAuspiciousDate } from "./findAuspiciousDate.js";

/** All registered tools (Kakao policy: 3–20, recommended 3–10; we run 7). */
export const ALL_TOOLS: ToolDef[] = [
  computeSajuChart,
  getTodayFortune,
  analyzePersonality,
  getCompatibility,
  getYearlyFortune,
  interpretName,
  findAuspiciousDate,
];

export const TOOL_NAMES = ALL_TOOLS.map((t) => t.name);
