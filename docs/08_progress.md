# 08. 진행 상황 (Progress) — 단일 진실 소스(SSOT)

> 세션 간 연속성. `/handoff`로 갱신. CLAUDE.md "현재 상태"와 어긋나면 이 파일 기준.
> 최종 갱신: 2026-06-27

## 마일스톤
- [x] 2번째 제출작 아이디어 확정 (한국형 사주 운세, D-101)
- [x] 해외 벤치마크 리서치 (소비자 MCP = 점성술뿐 → 한국화)
- [x] 명식 엔진 manseryeok-js(MIT) 확정 + 라이선스 검증 (D-102, docs/05)
- [x] AGPL 금지·개념만 참조 결정 (D-104)
- [x] 해석 전략(자체 데이터 3층 파이프라인) 확정 (D-105, docs/05)
- [x] 통합 툴 정의 (docs/02, 03) → **D-108로 코어 6툴 + 시그니처 4종으로 격상**
- [x] **1번째 작품(Korea Trip Concierge) 실전 경험 이식** (docs/09, D-106/D-107) — KC 환경변수 없음·linux/amd64·등록절차·검증 스택 확보
- [x] **제품 격상 결정** (D-108 단계적진입·시그니처4종·데일리키트 / D-109 키없는 날씨 Open-Meteo / D-110 무저장 프로필코드·리텐션=클라이언트 스케줄링→카톡)
- [x] **프로젝트 초기화** (TS+Node22, MCP SDK v1.29, express5, zod, manseryeok 설치 / 네이밍 빌드게이트·24k가드·한글 칩푸터·면책 공통 lib)
- [x] **엔진 코어 + 첫 툴 + 테스트** — manseryeok 래퍼(`computeChart`), 자체 명리 데이터(천간/지지 오행·음양·띠, 상생상극, 십신), 프로필 코드(`SC1|...`), `computeSajuChart` 툴. **`tsc` 통과 + vitest 17개 통과**(입춘 경계·시 모름·십신·코드 왕복 검증)
- [x] 자체 해석 **텍스트** 데이터 1차 — 십신 10 의미(`data/sipsin.ts`)·오행 5 성격+럭키(`data/ohaeng.ts`)·사주 16유형(`data/sajuType.ts`). (이름풀이 규칙은 interpretName 때)
- [x] **코어 6툴 전부 구현·검증**: computeSajuChart·getTodayFortune·analyzePersonality·getCompatibility·getYearlyFortune·interpretName (빌드게이트+tsc OK·테스트 42개·MCP 스모크 6툴 OK)
- [x] **모든 결과 공유 카드 + 바이럴 훅**(`lib/share.ts`): 귀여운 카드 UI + 수신자 "나도 보기" CTA(`내 이름 풀이해줘` 등) + 서비스명 → 공유받은 사람도 바로 따라 쓰게 유도(공개투표 모수↑)
- [x] **데일리 처방 강화**: 오늘의 기운에 럭키 음식·시간대 추가(개운법, 무키)
- [x] `src/server.ts`(express5 stateless) + `GET /` 헬스 + 3툴 등록 → `npm run build`(네이밍게이트+tsc) 통과, **테스트 28개 통과**
- [x] **로컬 MCP 스모크 통과**(`scripts/smoke.ts` SDK 클라이언트: tools/list 3개·annotations 5종·desc<1024·서비스명·실호출 렌더 OK)
- [x] **택일 툴 `findAuspiciousDate`(7번째, 보조 유틸)** — 명식 충(沖) 회피 + 손 없는 날(음력 끝 9·0) + 목적별 가중 → 길일 Top N. 칩은 리텐션 기능으로 회귀. (리서치 차별화)
- [x] **Open-Meteo 날씨·미세먼지 보강(무키)** — getTodayFortune에 best-effort(위치 시·2.5s·실패해도 운세 정상). 한글 도시명용 로컬 좌표 테이블(지오코딩 폴백). 라이브 확인 OK.
- [ ] **배포 URL 대상 정식 MCP Inspector** 통과
- [ ] Dockerfile(linux/amd64) + public repo + 라이선스 점검
- [ ] KC **Git 소스 빌드**(키 없음 → 환경변수 입력 불필요) → Active → Endpoint URL
- [ ] PlayMCP 임시등록 → 도구함 테스트 → 대화예시 3개
- [ ] /check 통과 → 심사요청(≤7/7) → 전체공개 → 비즈폼 응모(≤7/14)

## KC 슬롯 현황
- 계정당 **2대**. 1대 = **Korea Trip Concierge**(이미 KC 배포·Active, ID 638). 2대째 = **Saju Concierge**(이 프로젝트).
- 둘 다 같은 카카오계정. 비즈폼은 최대 2개 MCP 제출 가능 → 두 작품 동시 응모.

## 지금 바로 다음 할 일 (Next)
1. **본선 Kakao Tools Widget용 "귀여운 UI" 비주얼 시안** — 카드 그래픽 목업(예선=텍스트 카드 유지, 본선 위젯 대비).
2. **대화 예시 3개** + 대표 이미지(정적, 움짤 금지) 준비.
3. R-DOC 동기화: docs/03(7툴 계약·공유카드·처방·날씨·프로필코드).
4. 배포: public Git repo 초기화 → KC Git 소스 빌드 → Active → 배포 URL 정식 Inspector → PlayMCP 임시등록 → 심사요청(≤7/7).
5. 출품 전: 페르소나 멀티에이전트 시나리오 스윕(kpass식 7차원·적대적) + `/check`.

## 블로커 / 확인 필요
- ✅ **응답 크기 24k 확정** — 노션 심사정책 원문 "Response 24k 초과 시 에러→반려". (20k설은 오정보.) 현재 응답 ~0.7k라 여유 충분.
- ✅ **노션 원문 정독 완료**(크롬 Claude-in-Chrome) — 개발가이드·심사정책·FAQ·공모전 참가가이드·KC등록(Git/컨테이너). 규칙 우리 docs와 일치.
- ⚠️ **'정보 불러오기'=재심사 트리거** — 등록 후 툴 변경 시 재심사. 심사요청 전 6툴 확정 후 등록. description에 정확한 툴 개수 쓰지 말 것. AI채팅 동시 10 MCP.
- 🔴 **경쟁자 존재(빈 땅 아님)** — 1FATE '정통 명리학'(격국·용신·신살48·12운성, status closed?)·'사주봄'(오늘/띠별/행운시간) 라이브. 단순 클론은 반려 → 시그니처로 차별화 필수 (D-113).
- Open-Meteo: 비상업 한정 + 출처표기(CC BY 4.0). 본선/상업화 시 재검토 (D-109)
- 타로(보조/후순위): 카드 이미지 저작권 → 1차 텍스트 의미만
- 본선 Kakao Tools Widget 스펙은 비공개. **스케줄→카톡 발송은 카카오 공식 패턴 확인**(에이전트 레이어·본인 나챗방 한정·OTT 10분 수동갱신).

## 세션 로그
- 2026-06-26: 사주 컨시어지 문서 세트 생성(CLAUDE.md + docs 01~08 + 슬래시 커맨드). 엔진(manseryeok-js MIT)·라이선스(AGPL 금지)·해석(자체 데이터 3층)·UX(칩+chartCode) 확정.
- 2026-06-26: **1번째 작품(Korea Trip Concierge) 실전 경험 이식** — docs/09 신설(KC 환경변수 없음·linux/amd64·등록절차·Claude커넥터·git운영), 스택 검증구성 확정(TS+Node22/SDK v1.29/express5 stateless), docs/01·05/06/07/08·CLAUDE 갱신. D-106/D-107 기록.
- 2026-06-27: **킥오프 — 문서·kpass 전체기록 정독 → 제품 격상 + 빌드 시작.** (1) kpass docs 00~19 digest(승리전략·배포함정·UX·검증방법론) + 핵심 골격(server.ts/lib) 정독. (2) 사용자와 제품방향 정렬 → D-108/109/110(단계적진입·시그니처4종·데일리키트·키없는날씨·무저장 프로필코드·리텐션=클라이언트 스케줄링→카톡). (3) **프로젝트 초기화**: package.json/tsconfig/Dockerfile(linux-amd64, 키ARG 0)/공통 lib(constants·naming빌드게이트·markdown 24k·footer 한글칩·responses·env·loadEnv)/types/lint-naming. 의존성 설치(156pkg). (4) **만세력 v1.0.8 API 검증**(calculateSaju/lunarToSolar/isSupportedYear, 시 모름=hourPillar null, exports ESM OK). (5) **엔진 코어 작성**: elements.ts(천간/지지 오행·음양·띠·상생상극·십신 — 자체작성), chart.ts(computeChart 래퍼+오행분포+십신+띠), profile.ts(프로필코드 SC1| 인코딩/디코딩·성별정규화). (6) **computeSajuChart 툴** + index. **tsc 통과 + vitest 17개 통과**(README 검증값 경오·신사·경진·계미, 입춘경계, 시모름, 십신, 코드왕복). 실제 렌더 출력 확인 OK. (7) Open-Meteo 검증(무키·CC BY 4.0·비상업한정). R-DOC: 07/08/05 갱신.
- 2026-06-27 (이어서): **코어 3툴 빌드+검증 완료.** 자체 해석 데이터(`data/sipsin·ohaeng·sajuType`: 십신10·오행5럭키·16유형) + 엔진 로직(`engine/daily·personality`, 결정론·순수함수, `elements`에 categoryOf/categoryFor 추가). **getTodayFortune**(데일리 키트: 점수·키워드 4·럭키 색/숫자/방향/아이템·do&don'ts·직업맞춤·매일받기 넛지·targetDate)·**analyzePersonality**(사주 16유형 4축) 구현 + computeSajuChart를 공유헬퍼(`tools/_shared`)로 리팩터. `server.ts`(stateless)+index 3툴. **npm run build(네이밍게이트+tsc) OK · 테스트 28개 OK · 로컬 MCP 스모크(SDK 클라이언트 `scripts/smoke.ts`) OK**(tools/list 3·annotations5·desc<1024·서비스명·실호출 렌더). 노션 리서치=개인워크스페이스 404→공개소스 재구성(스케줄→카톡 공식패턴·일정·상금 검증, 20k/툴개수재심사 플래그). R-DOC: 07/08 갱신. D-111.
- 2026-06-27 (이어서2): **노션 원문 정독(크롬 Claude-in-Chrome).** 개발가이드·심사정책·FAQ·공모전 참가가이드·KC등록(Git/컨테이너) 전부 읽음 → 규칙 우리 docs와 일치(24k 확정·툴3~10/최대20·annotations5·영문desc≤1024+서비스명·p99 3s 필수·PII6·자동생성/유료/클론 반려·정보불러오기=재심사·AI채팅 10MCP). **🔴 경쟁자 발견(1FATE 정통명리학·사주봄)→'빈 땅' 아님→차별화 전략(D-113).** 외부키0 철회(D-112). R-DOC: CLAUDE.md·01·02·07·08 갱신.
- 2026-06-27 (이어서3): **남은 코어 3툴 완성 + 차별화 실행.** getCompatibility(궁합 카드)·getYearlyFortune(세운+분기)·interpretName(한글 음 오행, `engine/name.ts`) 구현 → **코어 6툴 완성.** 차별화 리서치 에이전트(백그라운드) 결과 반영: ① **전 툴 공유 카드+바이럴 훅**(`lib/share.ts`: 귀여운 카드 UI + 수신자 "나도 보기" CTA + 서비스명 → 공유받은 사람 유입) ② **데일리 처방 강화**(럭키 음식·시간대 = 개운법, `ohaeng.food`/`LUCKY_TIME`) ③ 포지셔닝 "사주 데일리 비서"(D-114). `responses.ok(body,choices,share?)`로 공유 카드 주입. **빌드(6툴)+tsc OK·테스트 42개 OK·MCP 스모크 6툴 OK**(SMOKE_OK). R-DOC: 02·07·08. D-114.
- 2026-06-27 (이어서4): **택일 + 날씨 보강(쭉쭉 진행).** `findAuspiciousDate`(7번째 툴·보조 유틸): `engine/auspicious.ts`(solarToLunar로 일진+음력일 → 충 회피·손없는날·목적별 가중, 순수함수). `lib/weather.ts`(Open-Meteo 무키 날씨+대기질, 한글 도시 로컬 좌표표+지오코딩 폴백, NODE_ENV=test 스킵) → getTodayFortune async·openWorldHint:true. **빌드(7툴)+tsc OK·테스트 47개·라이브 스모크 OK**(서울 26°C 맑음·미세먼지 + 이사 길일 8/2 무신일 90점 손없는날). 버그: 검색월 `month`↔생월 충돌 → `searchMonth`로 rename 수정. R-DOC: 07/08. D-115.
