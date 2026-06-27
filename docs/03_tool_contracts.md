# 03. 툴 입출력 계약 (Tool Contracts)

> 구현의 단일 기준. 카카오 규칙(01) 준수: 영문 description(≤1024, 서비스명 포함), annotations 5종, Markdown 응답(≤24k), 끝에 선택지 칩(04).
> 모든 툴 readOnly(계산·조회), 개인정보 미저장.

공통 annotations: `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`(외부 API 없이 내부 계산·데이터). `title`은 사람이 읽을 영문 이름.
- **idempotentHint 주의(1번째 작품 교훈)**: 같은 입력에 항상 같은 결과면 `true`, 시간/난수로 결과가 바뀌면 `false`.
  - `true`: computeSajuChart, analyzePersonality, interpretName, translateMenu류, getYearlyFortune(특정연도 고정 시)
  - `false`: getTodayFortune(오늘=시간 변동), drawTarot(난수), getYearlyFortune(targetYear 미지정 시 올해 기준)

공통 입력 타입 `BirthInput`: `{ year, month, day, hour?, minute?, isLunar?: boolean, isLeapMonth?: boolean, gender?: "M"|"F", unknownTime?: boolean }`

---

## 1. `computeSajuChart` (기반)
- **title**: "Compute Saju Chart"
- **description(영문)**: "Computes the Four Pillars (year/month/day/hour) and Five-Element distribution from a birth date and time using a Korean manseryeok engine. Returns a compact chart code reusable by other tools. Saju Concierge(사주 컨시어지)."
- **inputSchema**: `BirthInput`
- **output(Markdown)**: 4기둥(한글+한자), 오행 분포 요약, 일간, (가능 시) 십신 개략. + **명식 요약 코드**(후속 툴 재사용용) + 선택지 칩.
- 엔진: `@fullstackfamily/manseryeok` `calculateSaju()` (05 참조)

## 2. `getTodayFortune`
- **title**: "Get Today's Fortune"
- **description(영문)**: "Interprets today's energy for a person by comparing today's day-pillar against their Saju chart, in a fun, entertainment-only tone. Saju Concierge(사주 컨시어지)."
- **inputSchema**: `BirthInput` 또는 `{ chartCode: string }`(1번 결과 재사용)
- **output**: 오늘의 기운 한 문단 + 키워드(애정/재물/주의) + 면책. 끝에 선택지(올해 운세/궁합).
- 해석: 자체 데이터(일진 vs 일간 오행 상생상극) + LLM 표현.

## 3. `getYearlyFortune`
- **title**: "Get Yearly Fortune"
- **description(영문)**: "Outlines the fortune flow for a given year using the year-pillar (sewun) and a rough major-luck (daewun) view, entertainment-only. Saju Concierge(사주 컨시어지)."
- **inputSchema**: `BirthInput | {chartCode}` + `{ targetYear?: number }`
- **output**: 연 흐름 개략 + 분기 키워드 + 면책. 끝에 선택지.

## 4. `getCompatibility`
- **title**: "Get Compatibility"
- **description(영문)**: "Compares two people's Saju charts (Five-Element balance and pillar relationships) to give a fun compatibility read. Saju Concierge(사주 컨시어지)."
- **inputSchema**: `{ personA: BirthInput|{chartCode}, personB: BirthInput|{chartCode}, relation?: "love"|"friend"|"work" }`
- **output**: 궁합 점수(엔터)·강점·주의점 + 면책. 끝에 선택지(각자 오늘 운세).
- ⚠️ 공유성 높은 핵심 기능 → 결과를 공유하기 좋은 형태로.

## 5. `analyzePersonality`
- **title**: "Analyze Personality"
- **description(영문)**: "Describes innate tendencies from the Saju chart based on Ten Gods (sipsin) and Five-Element balance, in a supportive tone. Saju Concierge(사주 컨시어지)."
- **inputSchema**: `BirthInput | {chartCode}`
- **output**: 성향 요약 + 강점/약점 + 어울리는 분야. 끝에 선택지.

## 6. `interpretName`
- **title**: "Interpret Name"
- **description(영문)**: "Interprets a Korean name using stroke counts and Five-Element associations with simple, self-contained rules, entertainment-only. Saju Concierge(사주 컨시어지)."
- **inputSchema**: `{ name: string, hanja?: string }`
- **output**: 이름 오행·획수 풀이 + 인상. 끝에 선택지.
- ⚠️ 자체 규칙(획수·오행 매핑)으로 구현. 외부 작명 DB 의존 금지.

## 7. `drawTarot`
- **title**: "Draw Tarot"
- **description(영문)**: "Draws one or a small spread of tarot cards and gives upright/reversed meanings from a self-authored meaning set, entertainment-only. Saju Concierge(사주 컨시어지)."
- **inputSchema**: `{ spread?: "one"|"three", question?: string }`
- **output**: 뽑힌 카드(정/역) + 의미 + 종합. 끝에 선택지(다시 뽑기/오늘 운세).
- ⚠️ **카드 의미 텍스트만**(자체 작성). 카드 이미지는 저작권 확인 전까지 미사용(05).

---

## 공통 규칙
- **24k 가드**: 응답 길면 요약. **면책 문구** 짧게 상시 포함.
- **chartCode 재사용**: 1번이 만든 요약 코드를 2~5번이 받으면 재입력 없이 처리(stateless 우회).
- 부정 운세는 완곡·건설적. 개인정보 6종 미포함.
