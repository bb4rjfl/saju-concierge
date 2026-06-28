# CLAUDE.md — Saju Concierge (프로젝트 헌법)

> 이 파일은 Claude Code가 **매 세션 자동으로 읽는** 최상위 컨텍스트다.
> 작업 시작 전 반드시 이 파일과 `docs/` 의 관련 문서를 먼저 읽고 **맥락을 잃지 않도록** 한다.
> 규칙·스펙·결정이 바뀌면 이 파일과 `docs/`를 **그 즉시 갱신**한다. (R-DOC 참조)

---

## 0. 이 프로젝트가 뭔가 (한 문단)

**Saju Concierge** 는 생년월일시를 입력하면 사주 명식을 계산해 **오늘의 기운·올해 운세·궁합·이름풀이** 등을 재미있게 풀어주는 **MCP 서버**다. 카카오 **Agentic Player 10** 공모전 출품작(내국인용)이며, 외국인용 Korea Trip Concierge와 짝을 이루는 **2번째 제출작**이다. **목표는 본선 진출 후 대상(1등) 수상.**

핵심 컨셉: 명식 계산은 검증된 오픈소스(MIT)에 맡기고, **우리는 해석 레이어와 UX에 집중**한다. 해외에서 검증된 소비자 MCP 패턴(점성술)을 **한국식 사주로 한국화**한다. ⚠️ **단 "빈 땅"은 아니다** — PlayMCP에 이미 사주 MCP가 존재한다(1FATE '정통 명리학', '사주봄'). 그래서 **차별화가 관건**이고(클론은 심사 반려), 우리는 그들의 *정통·전문가형*과 정반대인 **재미·공유·매일 습관·대중 접근성**으로 간다: 사주 MBTI 유형·데일리 럭키 키트·공유 궁합 카드·칩 여정·카톡 데일리 발송. (docs/07 D-113) 사용자가 매번 길게 입력하지 않도록 **버튼/선택지(오늘의 기운 [+], 궁합 보기 [+])를 눌러 이어가는** UX를 기본으로 한다.

---

## 1. 작업 시작 전 필독 순서 (매 세션)

1. **이 파일(CLAUDE.md)** — 전체 맥락·규칙 진입점
2. `docs/01_kakao_playmcp_rules.md` — ⭐ 카카오 PlayMCP 개발가이드 + 심사정책 (반려 방지, 절대 규칙)
3. `docs/02_product_spec.md` — 제품 정의 + 통합 툴 스펙
4. `docs/03_tool_contracts.md` — 각 툴의 입출력 계약 (JSON, 구현 기준)
5. `docs/04_ux_interaction.md` — "버튼/선택지로 이어가기" 응답 패턴
6. `docs/05_engine_and_licenses.md` — ⭐ 계산 엔진·해석 데이터·라이선스 준수 (manseryeok-js + 자체 해석)
7. `docs/06_working_agreement.md` — 작업 방식·코딩 규칙·정의(DoD)
8. `docs/07_decision_log.md` — 결정 이력 (왜 이렇게 했나)
9. `docs/08_progress.md` — 진행 상황·다음 할 일 (세션 간 연속성, SSOT)
10. `docs/09_kc_deploy_playbook.md` — ⭐ KC 배포·실전 함정 (1번째 작품 경험 이식)
11. `docs/10_demo_conversations.md` — PlayMCP 등록용 대화예시 3개
12. ⭐ **`docs/11_handoff.md` — 최신 핸드오프(새 세션 진입점). 현재 상태·남은 일·함정·작업규칙 풍부판.**

> **새 세션은 `docs/11_handoff.md` + `docs/08_progress.md`(SSOT)부터.** 단순 작업이면 1·6만, 기능 변경 시 1~6 모두 확인.

---

## 2. 절대 어기면 안 되는 규칙 (요약 — 전문은 docs/01, docs/05)

### 카카오 (docs/01)
- ❌ 서버명·툴명에 `kakao` 금지 (대소문자·위치 불문)
- ✅ MCP 버전 `2025-03-26` ~ `2025-11-25`, **Streamable HTTP**, **Remote**, **Stateless 권장**
- ✅ 툴 **3~10개**, 이름 `A-Z a-z 0-9 _ -` 1~128자, 대소문자 구분
- ✅ 모든 툴 `name / description / inputSchema / annotations(5종 전부)` 채움
- ✅ description **영문**, 1,024자 이내, 서비스명(Saju Concierge) 포함
- ✅ 응답은 **Markdown TextContent**, **24k 초과 금지**, API JSON 원문 금지(정제)
- ✅ 성능 **평균 100ms / p99 3,000ms**
- ❌ 광고 유도·상업적 링크 과다·리워드 금지
- ❌ 개인정보 6종(주민/면허/여권/외국인등록/카드/계좌) 수집·전송 금지
- ❌ "LLM이 웹검색만으로 가능한 기능"만 제공 금지 → **자체 계산/해석 데이터 = 고유가치**

### 라이선스 (docs/05) — 이 프로젝트의 생명선
- ✅ 명식 계산은 **manseryeok-js (MIT)** 만 사용
- 🛑 **AGPL 코드(orrery, Swiss Ephemeris 등) 복붙·수정·의존 절대 금지.** AGPL은 서비스 제공 시 전체 소스 공개를 강제 → 우리 서버 전체가 전염된다.
- ✅ AGPL 프로젝트에서는 **명리학 개념·공식만** 참고(공식엔 저작권 없음). 코드 한 줄도 가져오지 않는다.
- ✅ 해석 데이터는 **공개된 명리학 상식을 우리 말로 직접 작성.** 특정 사이트 문장 복사 금지.

### 도메인 (docs/02)
- ✅ 운세는 **엔터테인먼트 톤.** 단정적 예언("곧 큰돈을 법니다") 금지, 불안 조장 금지.
- ✅ 생년월일시는 받되 **저장하지 않고 계산 후 폐기**(stateless). 생년월일은 개인정보 6종 아님이나 보수적으로.

---

## 3. 핵심 워크플로우 규칙

- **R-LOCAL**: 모든 기능은 로컬에서 **MCP Inspector 통과** 후에만 KC 배포.
- **R-AMD64**: Docker 이미지는 `linux/amd64`로 빌드. arm64 = 활성화 실패.
- **R-DEPLOY**: 배포는 **Git 소스 빌드**(public repo + 루트 Dockerfile) 기본.
- **R-LICENSE**: 새 의존성 추가 시 **라이선스를 먼저 확인**하고 docs/05·07에 기록. MIT/Apache/BSD/ISC 등 허용형만. (A)GPL 계열 발견 시 즉시 중단·보고.
- **R-DOC**: 규칙/스펙/결정이 바뀌면 **같은 변경에서** 해당 docs와 `07_decision_log`·`08_progress`를 갱신.
- **R-TIMELINE**: "7/7 심사요청 마감"에서 역산. 6월 말~7월 초 1차 배포+심사요청 목표.

---

## 4. 슬래시 커맨드 (Claude Code)

- `/sync` — 세션 시작 시 docs 전체 재확인 + progress 요약
- `/check` — 응모 전 카카오 규칙 + 라이선스 준수 점검
- `/newtool` — 새 툴 추가 시 스펙·계약·문서·테스트 일관 생성
- `/handoff` — 세션 종료 시 progress·decision_log 갱신 후 다음 할 일 정리

(정의는 `.claude/commands/` 참조)

## 5. 기술 스택 (1번째 작품에서 검증된 구성 — docs/09)
- 언어/런타임: **TypeScript + Node 22**, MCP 공식 SDK **`@modelcontextprotocol/sdk` v1.29**, Streamable HTTP, **stateless**
  - 엔트리 `src/server.ts`(express 5, `POST /mcp`, 요청마다 server+transport 생성)
  - Concierge와 스택 통일 → 관리 편의, 검증된 골격 재현
- 명식 엔진: **`@fullstackfamily/manseryeok` (MIT)**
- 해석: 자체 데이터(천간·지지 오행, 십신, 십이운성, 오행균형) + LLM 표현
- 공통 인프라 `src/lib/`: 24k 가드 · 칩 푸터 · **네이밍 린트(kakao 빌드게이트)** · 면책 유틸
- 검증 루프: `npm run build`(네이밍 린트+tsc) → `npm test`(vitest) → MCP Inspector
- 배포: 루트 Dockerfile(**`--platform=linux/amd64`**) → GitHub(**public**) → PlayMCP in KC **Git 소스 빌드**
  - ✅ **외부 API 키 0개 → KC 환경변수 없음 문제를 안 겪음**(1번째 작품의 최대 난관 회피). 헬스체크 `GET /` 추가.

## 6. 현재 상태
- [x] 아이디어 확정, 해외 벤치마크(점성술 MCP) 한국화 결정
- [x] 계산 엔진 manseryeok-js(MIT) 확정, 라이선스 검증 완료
- [x] 해석 전략(자체 데이터 + LLM 표현) 확정
- [x] **1번째 작품(Korea Trip Concierge) 실전 경험 이식**(docs/09): KC 환경변수 없음·linux/amd64·등록절차·검증 스택
- [ ] 프로젝트 초기화 + manseryeok-js 연동
- [ ] 자체 해석 데이터 작성 (십신·오행·십이운성)
- [ ] 툴 구현 → MCP Inspector 통과
- [ ] KC Git 소스 빌드 → 임시등록 → 도구함 테스트 → 대화예시 3개
- [ ] 심사요청(≤7/7) → 전체공개 → 비즈폼 응모(≤7/14)

> KC 슬롯 2대 중 1대는 Korea Trip Concierge(이미 Active), 2대째가 Saju. 상세 진행은 `docs/08_progress.md`(SSOT).
