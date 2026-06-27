/**
 * 로컬 스모크 클라이언트 — MCP Inspector 없이 배포 골격을 빠르게 검증.
 * 사용: 서버를 먼저 띄우고(`node dist/server.js`) → `tsx scripts/smoke.ts`.
 * 환경변수 MCP_URL로 배포 URL(.../mcp) 대상 점검도 가능.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL(process.env.MCP_URL ?? "http://localhost:8080/mcp");
const client = new Client({ name: "saju-smoke", version: "0.0.0" });
await client.connect(new StreamableHTTPClientTransport(url));

const { tools } = await client.listTools();
console.log("TOOLS:", tools.map((t) => t.name).join(", "));
for (const t of tools) {
  const ann = t.annotations ?? {};
  const has5 =
    "title" in ann &&
    "readOnlyHint" in ann &&
    "destructiveHint" in ann &&
    "idempotentHint" in ann &&
    "openWorldHint" in ann;
  console.log(
    `- ${t.name}: descLen=${(t.description ?? "").length} hasService=${(t.description ?? "").includes(
      "Saju Concierge",
    )} ann5=${has5}`,
  );
}

async function call(name: string, args: Record<string, unknown>) {
  const r = (await client.callTool({ name, arguments: args })) as {
    content?: { type: string; text?: string }[];
  };
  const text = r.content?.[0]?.text ?? "";
  console.log(`\n=== ${name} (${text.length} chars) ===\n${text.slice(0, 500)}`);
}

await call("computeSajuChart", { year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: "여" });
await call("getTodayFortune", { profileCode: "SC1|1990-05-15|1430|127|F|서울|office" });
await call("analyzePersonality", { year: 1992, month: 11, day: 3 });
await call("getCompatibility", {
  personA: { profileCode: "SC1|1990-05-15|1430|127|F|서울|office" },
  personB: { year: 1992, month: 11, day: 3 },
  relation: "연인",
});
await call("getYearlyFortune", { profileCode: "SC1|1990-05-15|1430|127|F|서울|office", targetYear: 2026 });
await call("interpretName", { name: "김민수" });
await call("findAuspiciousDate", {
  profileCode: "SC1|1990-05-15|1430|127|F|서울|office",
  purpose: "이사",
  searchMonth: "2026-08",
});

// 적대적: 예전엔 SDK가 raw -32602를 던지던 입력들 → 이제 친절 카드여야 함
await call("computeSajuChart", { year: 1995, month: 13, day: 5 });
await call("findAuspiciousDate", { year: 1990, month: 5, day: 15, count: 99 });

await client.close();
console.log("\nSMOKE_OK");
