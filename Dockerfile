# Saju Concierge — MCP server (Streamable HTTP, stateless).
# MUST build for linux/amd64 (KC rejects arm64). Build:
#   docker build --platform linux/amd64 -t saju-concierge .
# KC Git-source build uses this root Dockerfile directly.
#
# NOTE: Saju has ZERO external API keys (all computation is local: manseryeok-js
# + our own interpretation data). So — unlike a key-dependent server — this
# Dockerfile needs no build-arg secret injection, and KC's "no env var field"
# limitation simply does not apply. Clean public Git-source build.
FROM --platform=linux/amd64 node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build

FROM --platform=linux/amd64 node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

ARG GIT_SHA="dev"
ENV GIT_SHA=$GIT_SHA

EXPOSE 8080
CMD ["node", "dist/server.js"]
