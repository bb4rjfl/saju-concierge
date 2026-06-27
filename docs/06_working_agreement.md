# 06. 작업 방식 협약 (Working Agreement)

> 맥락을 잃지 않고, 매번 최신화하며, 카카오 규칙과 라이선스를 꼼꼼히 지키며 일하기 위한 규칙.

---

## 1. 세션 루틴
- **시작**: `/sync` → CLAUDE.md + docs 확인, `08_progress.md`의 "다음 할 일" 파악.
- **작업 중**: 기능 추가/변경 시 `01`(카카오 규칙)·`03`(계약)·`05`(라이선스) 위반 없는지 즉시 대조.
- **종료**: `/handoff` → `08_progress`·`07_decision_log` 갱신, 다음 할 일 명시.

## 2. 문서 최신화 규칙 (절대)
- **R-DOC-1**: 규칙/스펙/툴/데이터/결정 변경 시 **같은 변경에서** 해당 docs 갱신. 문서 갱신 없는 코드 변경 금지.
- **R-DOC-2**: 결정은 `07_decision_log.md`에 `D-1xx`로 기록(무엇을·왜·대안).
- **R-DOC-3**: 진행상황은 `08_progress.md`가 **단일 진실 소스(SSOT)**.
- **R-DOC-4**: `CLAUDE.md` "현재 상태"와 `08`이 어긋나면 `08` 기준으로 맞춤.
- **R-DOC-5 (핸드오프)**: 세션이 길어지거나 배포 단계에 진입하면, 1번째 작품처럼 **자기완결적 핸드오프 문서**(다음 세션이 그것만 읽고 이어갈 수 있는 풍부한 맥락판)를 `docs/`에 추가. 새 세션 진입점으로 명시.

## 3. 코딩 규칙
- **언어**: TypeScript + MCP 공식 SDK, Streamable HTTP, **stateless**.
- **툴 등록**: 각 툴은 `03`의 inputSchema·annotations(5종)·영문 description(≤1024, 서비스명 포함) 그대로.
- **응답 빌더**: 공통 `renderMarkdown()` + `buildChoiceFooter()` + `appendDisclaimer()` 사용. **24k 가드 필수**.
- **계산/해석 분리**: 명식·십신·오행은 결정론적 코드(우리 데이터). 표현 톤만 LLM에 위임(05의 3층 파이프라인).
- **네이밍 린트**: 서버명·툴명 `kakao`(대소문자 불문) 포함 시 빌드 실패.
- **시크릿/개인정보**: 키는 환경변수. 생년월일시 **저장·로깅 금지**(계산 후 폐기). 개인정보 6종 미처리.
- **라이선스(R-LICENSE)**: 새 의존성은 라이선스 확인 후에만. AGPL/GPL/SSPL 금지. `05`·`07`에 기록.
- **성능**: 평균 100ms / p99 3,000ms. 명식 계산은 메모리 연산이라 무리 없음.

## 4. DoD — 툴 1개
- [ ] inputSchema·annotations(5종)·영문 description(≤1024, "Saju Concierge(사주 컨시어지)" 포함)
- [ ] 응답 Markdown·정제·**≤24k**·**면책 문구** 포함
- [ ] **선택지 칩 푸터**(2~4개, 04 포맷) + chartCode 재사용 동작
- [ ] 계산은 manseryeok-js, 해석은 자체 데이터 (LLM은 표현만)
- [ ] 단위 테스트(정상/경계/24k) + **MCP Inspector 통과**
- [ ] p99 3s 확인 / 관련 docs·progress 갱신

## 5. DoD — 배포/응모
- [ ] Dockerfile **`--platform=linux/amd64`**·루트, 로컬 컨테이너 기동 OK, 헬스체크 `GET /` 동작
- [ ] **라이선스 점검 통과**(AGPL 0건)
- [ ] **빌드에 네이밍 린트 포함**(kakao 포함 시 빌드 실패)
- [ ] public repo → KC **Git 소스 빌드** → Active → Endpoint URL (키 없음 → 환경변수 입력 불필요)
- [ ] **MCP Inspector**로 배포 URL 점검(Streamable HTTP, tools/list, 샘플 호출, 24k·칩)
- [ ] PlayMCP 임시등록 → **"정보 불러오기" 성공** → 도구함 → AI채팅/Claude커넥터 테스트
- [ ] 대화 예시 3개(예: "1990년 5월 15일 오후 2시 30분생 오늘 운세")
- [ ] `/check` 통과(01 §7) → 심사요청(**≤7/7**) → 승인 → **전체공개** → 비즈폼(**≤7/14**, 1회)
- 상세 절차·함정: `docs/09_kc_deploy_playbook.md`

## 6. 일정 역산 (R-TIMELINE)
- 6월 말~7월 초: 엔진 연동 + 자체 해석 데이터 + 핵심 툴(computeSajuChart, getTodayFortune, getCompatibility) 완성 + Inspector 통과 + 1차 KC 배포
- ~7/5: 7개 툴 + 대화예시 + 점검
- **~7/7: 심사요청** / ~7/12: 승인·전체공개 / **~7/14: 비즈폼 응모**
