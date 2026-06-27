# 09. KC 배포 · 실전 함정 플레이북 (첫 프로젝트 Korea Trip Concierge 경험 이식)

> 출처: 같은 대회의 **1번째 제출작 Korea Trip Concierge**를 실제로 개발·KC 배포·PlayMCP 등록까지 진행하며 겪은 실전 경험(그 프로젝트 docs/10~16 핸드오프·런북).
> 목적: Saju는 **같은 시행착오를 반복하지 않는다.** 카카오 공식 가이드(01)에 없는 "실제로 부딪힌 것"만 모았다.

---

## 1. 🛑 KC에는 "환경변수(API 키) 입력란이 없다" (가장 큰 함정)

첫 프로젝트의 최대 난관. **Git 소스 빌드·컨테이너 이미지 두 방식 모두 KC에 키를 넣을 칸이 없다.** 키가 필요한 서버는 빌드 시점에 이미지로 키를 구워 넣어야 했고, 그 과정에서:
- 키를 Git에 커밋 → **안전분류기에 차단(옳음)**. 절대 금지.
- 해법 = **GitHub Secrets → 비공개 ghcr 이미지(빌드 시 ARG→ENV 주입) → KC에 컨테이너 이미지로 등록**(KC가 PAT `read:packages`로 pull).
- 헬스체크 `/` 응답의 `sources` 플래그가 전부 `true`인지로 "키가 실제 주입됐나"를 즉시 확인.

### ✅ Saju에 주는 의미 (오히려 강점)
**Saju는 외부 API 키가 0개다**(명식 계산·해석 모두 내부). 따라서:
- **Git 소스 빌드(public repo + 루트 Dockerfile)로 키 주입 고생 없이 깔끔하게 배포된다.** 위 ghcr 비공개 우회가 불필요.
- 이 단순함 자체가 안정성 점수·운영 리스크에서 유리. **이 강점을 유지한다 — 굳이 외부 키 의존을 새로 만들지 않는다.**

---

## 2. 배포 방식 결정 (Saju)

- **방식 A — Git 소스 빌드(채택)**: public repo, 루트 `Dockerfile`, branch `main`, Dockerfile 경로 `Dockerfile`, PAT 불필요(public).
- 키가 없으므로 컨테이너 이미지(방식 B)나 ghcr 비공개가 필요 없다.
- **Dockerfile은 `--platform=linux/amd64` 명시**(arm64 = 활성화 실패. 첫 프로젝트에서 확인된 하드 제약).
- 헬스체크 엔드포인트(`GET /`)를 두어 `{"status":"ok","tools":N}` 반환 → 배포 직후 즉시 확인.

---

## 3. 런타임·스택 (첫 프로젝트에서 검증된 구성 그대로)

- **TypeScript + Node 22**, MCP 공식 SDK `@modelcontextprotocol/sdk` **v1.29**, **Streamable HTTP, stateless**.
- 엔트리 `src/server.ts`(express 5, `POST /mcp`). **요청마다 server+transport 생성**(세션 없음 = stateless).
- 공통 인프라 `src/lib/`: **24k 가드 · 칩 푸터 · 네이밍 린트(kakao 빌드게이트) · (Saju는 외부 fetch 거의 없음)**.
- 검증 루프: `npm run build`(**네이밍 린트 + tsc**) → `npm test`(vitest) → MCP Inspector.
- **네이밍 린트를 빌드에 포함**: 서버명·툴명에 `kakao`(대소문자 불문) 들어가면 **빌드 실패**. 첫 프로젝트가 이걸 빌드 게이트로 박아 사고를 원천 차단했다 — Saju도 동일 적용.

---

## 4. MCP Inspector 점검 (배포 URL 대상)

- `npm run inspect` → Transport **Streamable HTTP**, URL = KC Endpoint(`.../mcp`) → Connect.
- 체크: initialize 성공(serverInfo 이름 확인) / tools/list에 N개 노출 + 각 annotations·inputSchema 정상 / 샘플 호출(예: `computeSajuChart{...}`) / 응답 24k 이하·Markdown·칩 푸터.

---

## 5. PlayMCP 등록 절차 (첫 프로젝트가 확인한 정확한 순서)

1. PlayMCP 콘솔 → "새로운 MCP 서버 등록" → **MCP Endpoint**에 KC URL 입력 → **"정보 불러오기"**.
   - ⚠️ **"정보 불러오기"가 성공해야 한다.** 실패 = 내 MCP 엔드포인트/툴 스펙 문제.
2. 정보 입력 → **"임시 등록"**(절대 "등록 및 심사요청" 누르지 말 것).
3. **"MCP 상세 미리보기" → "도구함에 추가"** → **AI채팅(또는 Claude 커넥터)으로 충분히 테스트**.
4. **대화 예시 3개 입력** → 대표 이미지 등록(움직이는 이미지 금지).
5. 테스트 OK → **"심사 요청"**(≤7/7) → 승인 메일 → 공개 상태 **"나에게만 공개" → "전체 공개"** 전환 → 상세페이지 **브라우저 URL 복사** → 비즈폼 "Player 예선 참여"(≤7/14, 최대 2개, 1회).

### Claude 커넥터로 테스트 (유용)
PlayMCP가 **Claude 공식 커넥터**로 등록돼 있음. Claude Pro/MAX에서 설정 → 커넥터 → PlayMCP 검색·연결(카카오 OAuth) → 도구함 도구를 Claude에서 직접 호출해 시연·테스트 가능. 본선 데모에도 유용.

---

## 6. 응답·도구 설계에서 첫 프로젝트가 확인한 실전 교훈

- **idempotentHint 주의**: "지금/오늘" 류(시간 따라 결과 변동) 툴은 `idempotentHint: false`. 순수 명식 계산은 `true`. (Saju: computeSajuChart/analyzePersonality/interpretName = true, getTodayFortune/getYearlyFortune/drawTarot = false)
- **설명에 미구현 기능을 쓰지 말 것(R-DOC 정합)**: 첫 프로젝트가 description에 "crowd level"을 적었다가 데이터원이 없어 제거. **Saju도 description은 실제 동작과 1:1 일치**시킨다(없는 기능 광고 금지).
- **stateless 재호출 패턴**: 첫 프로젝트는 칩으로 다음 툴을 부를 때 직전 컨텍스트(도시 등)를 파라미터로 다시 넘기게 설계. **Saju의 chartCode 패턴이 정확히 같은 해법** — 명식을 들고 다닐 수 없으니 응답에 요약 코드를 실어 후속 툴이 재사용.
- **24k 가드 + 칩 푸터를 공통 유틸로**: 첫 프로젝트는 `markdown(24k가드)`, `footer(칩)`을 lib로 분리해 모든 툴이 동일 적용. Saju도 `buildChoiceFooter()` + `appendDisclaimer()` + 24k 가드를 공통화.

---

## 7. git / 환경 운영 (첫 프로젝트 환경 메모)

- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Windows 환경**: 줄바꿈 이슈로 `git -c core.autocrlf=false commit` 사용. PowerShell/Bash 둘 다 가능(구문 주의).
- `.env`는 `.gitignore`에 포함, **키 커밋 금지**(Saju는 키 자체가 거의 없지만 PORT 등은 .env로).
- 같은 PC의 새 세션은 `.env`를 `loadEnv`로 읽어 이어감(로컬 개발).

---

## 8. 일정 역산 (첫 프로젝트와 공유)

- 예선 6/15~7/14. **심사요청 ≤7/7**(심사 최대 7일, 7/7 요청분만 기한 보장). 승인 → 전체공개 → 비즈폼 ≤7/14.
- **KC 서버는 계정당 2대.** 1대 = Korea Trip Concierge(이미 배포·Active), 2대째 = **Saju**. 두 작품 모두 같은 카카오계정으로 운영.
- 첫 프로젝트가 이미 KC·PlayMCP 절차를 한 번 통과했으므로, **Saju는 그 경로를 그대로 밟으면 된다**(키 주입 단계는 생략 가능 = 더 빠름).

---

## 9. Saju가 첫 프로젝트에서 가져올 재사용 자산 (코드 레벨)

직접 복사할 순 없지만(다른 repo), **같은 구조로 재현**하면 시간 절약:
- `src/server.ts` express5 + Streamable HTTP stateless 골격
- `src/lib/` 의 24k 가드 · 칩 푸터 · 네이밍 린트(kakao 게이트) · TTL 캐시(필요 시)
- 루트 `Dockerfile`(linux/amd64) + `npm run build/test/inspect/dev` 스크립트 구성
- vitest 테스트 골격(순수 함수 위주로 테스트 락)
- `.github/workflows` — Saju는 public Git 소스 빌드라 ghcr 워크플로우 불필요(단순)
