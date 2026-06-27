/**
 * Project-wide constants. Single source for the service name so every tool
 * description includes it (Kakao rule §3-2: description must contain the
 * service name).
 */

/** MCP server name. MUST NOT contain "kakao" (Kakao naming rule). */
export const SERVER_NAME = "saju-concierge";

export const SERVER_VERSION = "0.1.0";

/** Service display name, embedded in every tool description (Kakao rule §3-2). */
export const SERVICE_NAME = "Saju Concierge(사주 컨시어지)";

/**
 * Hard ceiling on response size. Kakao rejects responses over 24k.
 * We guard well under it to leave headroom for transport overhead.
 */
export const MAX_RESPONSE_CHARS = 24_000;
export const RESPONSE_BUDGET_CHARS = 23_000; // soft budget; truncate body before footer

/**
 * Timeout (ms) for the ONE optional keyless data source we allow (Open-Meteo
 * weather/air, best-effort enrichment of the daily kit). p99 must stay under
 * 3,000ms — keep it short and never block the fortune on it.
 */
export const EXTERNAL_API_TIMEOUT_MS = 2_500;

/**
 * Entertainment-tone disclaimer appended to every interpretive response
 * (docs/02 §4, docs/04 §4). Keep it short and light.
 */
export const DISCLAIMER = "> 🙂 재미로 보는 운세예요. 중요한 결정은 스스로 내려요!";
