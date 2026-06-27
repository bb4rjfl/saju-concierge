# Saju Concierge 🔮

생년월일시를 입력하면 사주 명식을 계산해 **오늘의 기운·올해 운세·궁합·이름풀이·타로**를 재미있게 풀어주는 **MCP 서버**. 카카오 **Agentic Player 10** 공모전 출품작(내국인용, 외국인용 Korea Trip Concierge와 짝).

## 이 저장소를 처음 여는 사람(또는 Claude Code)에게

1. **`CLAUDE.md`** 부터 읽으세요. 프로젝트 헌법이자 모든 컨텍스트의 진입점입니다.
2. 카카오 규칙은 `docs/01` (절대 규칙 — 어기면 심사 반려).
3. **엔진·라이선스는 `docs/05`** (이 프로젝트의 생명선 — AGPL 금지).
4. 진행 상황은 `docs/08` (단일 진실 소스).

## 핵심 전략 (한 문장)
> 명식 계산은 검증된 MIT 라이브러리(manseryeok-js)에 맡기고, **해석은 우리가 직접 만든 명리학 데이터 + LLM 표현**으로 차별화한다. AGPL 코드는 개념만 참고하고 코드는 가져오지 않는다.

## 문서 맵
| 파일 | 내용 |
|---|---|
| `CLAUDE.md` | 프로젝트 헌법·규칙 요약·필독 순서 |
| `docs/01_kakao_playmcp_rules.md` | ⭐ 카카오 PlayMCP 개발가이드+심사정책+일정 |
| `docs/02_product_spec.md` | 제품 정의·툴 7개·톤/안전 |
| `docs/03_tool_contracts.md` | 툴 입출력 계약(JSON) |
| `docs/04_ux_interaction.md` | "버튼/선택지로 이어가기" + chartCode 패턴 |
| `docs/05_engine_and_licenses.md` | ⭐ 엔진·해석 데이터·라이선스(생명선) |
| `docs/06_working_agreement.md` | 작업 방식·코딩 규칙·DoD |
| `docs/07_decision_log.md` | 결정 이력 |
| `docs/08_progress.md` | 진행 상황(SSOT) |
| `docs/09_kc_deploy_playbook.md` | ⭐ KC 배포·실전 함정 (1번째 작품 경험 이식) |

## Claude Code 슬래시 커맨드
- `/sync` 세션 시작(컨텍스트 로드 + 다음 할 일)
- `/newtool` 새 툴 일관 추가
- `/check` 응모 전 카카오 규칙 + 라이선스 점검
- `/handoff` 세션 종료(문서 최신화)

## 핵심 제약 (요약)
- 서버명·툴명에 `kakao` 금지 · Streamable HTTP · Remote · Stateless
- 툴 3~10개 · annotations 5종 · 영문 description · 응답 Markdown ≤24k
- p99 3s · 광고/리워드 금지 · 개인정보 6종 금지 · 생년월일 미저장
- 운세 = **엔터테인먼트 톤**(단정·공포 금지) + 면책 문구
- **명식 = manseryeok-js(MIT)** / **AGPL(orrery·Swiss Ephemeris) 코드 금지**
- 자체 계산·해석 = LLM 단독 불가한 고유가치(반려 회피)

## 일정 (역산)
6월 말~7월 초 1차 배포 → **7/7 심사요청 마감** → 전체공개 → **7/14 비즈폼 응모**

## 기술 스택 (제안)
TypeScript + `@modelcontextprotocol/sdk` (Streamable HTTP, stateless) · `@fullstackfamily/manseryeok` (MIT) · Dockerfile(linux/amd64) → GitHub(public) → PlayMCP in KC
