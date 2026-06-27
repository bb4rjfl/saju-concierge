응모 전 점검을 수행한다. `docs/01_kakao_playmcp_rules.md` §7 + `docs/05` 라이선스를 기준으로 현재 코드/스펙을 대조하라:
- 서버명·툴명에 kakao 없음 / MCP 버전·Streamable HTTP·Remote·Stateless
- 툴 3~10개, 이름 규칙(A-Z a-z 0-9 _ -, 1~128, 대소문자 구분, 중복 없음)
- 모든 툴 annotations 5종 + inputSchema + 영문 description(<=1024, 서비스명 포함)
- 응답 Markdown·24k 이하·면책 문구·API원문 아님
- 평균100ms/p99 3s, 광고·리워드·상업유도 없음
- 자체 계산/해석 = LLM 단독 불가한 고유가치 있음
- 개인정보 6종 없음 + 생년월일 미저장
- **모든 의존성 라이선스 허용형(MIT 등), AGPL/GPL/SSPL 0건**
- MCP Inspector 통과 / 대화예시 3개
각 항목 OK/FAIL/WARN 표시, FAIL·WARN은 수정법 제시. 통과 못 하면 응모를 막는다.

추가(docs/09 KC 실전):
- Dockerfile에 --platform=linux/amd64 명시 / 헬스체크 GET / 동작
- 빌드에 네이밍 린트 포함(kakao 빌드게이트)
- 배포는 Git 소스 빌드(public, 키 없음 → KC 환경변수 입력 불필요)
- "지금/오늘" 류 툴 idempotentHint=false, 순수 계산 툴=true
- description은 실제 동작과 1:1 일치(미구현 기능 광고 금지)
