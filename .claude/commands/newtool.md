새 툴을 일관되게 추가한다:
1. `docs/03_tool_contracts.md` 형식으로 계약 작성: title, 영문 description(<=1024, "Saju Concierge(사주 컨시어지)" 포함), inputSchema, output(Markdown), annotations 5종.
2. 툴 개수 10개 초과 금지(넘으면 통합 제안).
3. 응답에 buildChoiceFooter() 칩(2~4개) + appendDisclaimer() + chartCode 재사용 설계(docs/04).
4. 계산은 manseryeok-js, 해석은 자체 데이터(docs/05 3층 파이프라인). 새 의존성 시 라이선스 먼저 확인(AGPL 금지).
5. 코드 스텁 + 단위 테스트(정상/경계/24k) 생성.
6. `docs/02`,`03`,`05`(의존성),`08_progress` 갱신. 결정 시 `07_decision_log`에 D-1xx 기록.
모든 단계에서 docs/01·05 위반 없는지 확인한다.
