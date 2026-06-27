/**
 * Centralized env access. Saju has NO external API keys (all computation is
 * local), so this is just PORT and the build SHA. Reads `process.env` LAZILY
 * (getters) so values set after module load (e.g. by loadEnv) are always seen.
 */

export const ENV = {
  get PORT(): string {
    return process.env.PORT ?? "8080";
  },
  /** Git commit the running image was built from — a deploy-freshness signal
   *  in the /health endpoint (tools count & version rarely change). */
  get GIT_SHA(): string {
    return process.env.GIT_SHA ?? "dev";
  },
};
