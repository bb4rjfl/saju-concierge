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
- [x] **(1) 콘텐츠 깊이 확장** — 데일리 문구 풀 시드변주(반복感↓), 16유형 연애/일/조언, 궁합 캐치프레이즈.
- [x] **(2) 정확성·일관성 감수 합격** — 113매핑+충/합 12×12 오류 0건, 16유형 균형, 폴리시 2개(성향 타이브레이크·택일 인성가점).
- [x] **(3) 적대적 QA 스윕(92케이스)+수정** — 🔴 raw -32602 누출 차단(숫자 제약을 스키마→엔진 친절검증으로), 엔진 영문에러 한글화, PII 프로필코드 차단, 이름 10자 캡, 잘못된 날짜/달 안내, 제목중복 수정. **테스트 56개·SDK경계 -32602 0건 확인.**
- [x] **배포 URL 대상 SDK 스모크(=Inspector 동급)** 통과 (라이브 7툴·궁합 대칭·날씨)
- [x] Dockerfile(linux/amd64) + public repo + 라이선스 점검(AGPL 0)
- [x] **KC 배포 Active — 컨테이너 이미지 방식**(D-119, public ghcr+Actions), `saju-concierge` ID 768, Endpoint `https://saju-concierge.playmcp-endpoint.kakaocloud.io/mcp`
- [x] **PlayMCP 임시등록 + 도구함 추가** (Tools 7 Online, 대화예시 3·대표이미지, Claude 커넥터로 호출 가능)
- [x] /check 통과
- [ ] **심사요청(≤7/7) → 전체공개 → 비즈폼 응모(≤7/14)** ← 남은 핵심

## KC 슬롯 현황
- 계정당 **2대**. 1대 = **Korea Trip Concierge**(이미 KC 배포·Active, ID 638). 2대째 = **Saju Concierge**(이 프로젝트).
- 둘 다 같은 카카오계정. 비즈폼은 최대 2개 MCP 제출 가능 → 두 작품 동시 응모.

## 지금 바로 다음 할 일 (Next)
> 상세·맥락은 **`docs/11_handoff.md`**(새 세션 진입점) 참조.
1. PlayMCP 도구함/AI채팅(또는 Claude 커넥터)으로 **대화예시 3개 흐름·칩 여정·공유카드 최종 점검**.
2. (코드 변경 있었으면) 재배포 후 라이브 health `build` sha=최신 확인. **7툴 셋 확정**(이후 툴 변경=재심사 트리거).
3. **심사 요청**(playmcp.kakao.com, ≤7/7) → 승인 → **전체 공개** → 상세 URL 복사.
4. **비즈폼 "Player 예선 참여"**(≤7/14, korea-trip+saju 2개 동시, 1회 제출). 비즈/사업자정보·서비스화면 별개 게이트 대비(kpass 2회 반려 경험).
5. (본선/선택) Kakao Tools Widget(카드 시안=청사진)·데일리 콘텐츠 풀 확장·스케줄→카톡 발송 시연.

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
- 2026-06-27 (이어서4): **택일 + 날씨 보강(쭉쭉 진행).** `findAuspiciousDate`(7번째 툴·보조 유틸): `engine/auspicious.ts`(solarToLunar로 일진+음력일 → 충 회피·손없는날·목적별 가중, 순수함수). `lib/weather.ts`(Open-Meteo 무키 날씨+대기질, 한글 도시 로컬 좌표표+지오코딩 폴백, NODE_ENV=test 스킵) → getTodayFortune async·openWorldHint:true. **빌드(7툴)+tsc OK·테스트 47개·라이브 스모크 OK**(서울 26°C 맑음·미세먼지 + 이사 길일 8/2 무신일 90점 손없는날). 버그: 검색월 `month`↔생월 충돌 → `searchMonth`로 rename 수정. **(C)** 본선 Widget용 "귀여운 카드" 비주얼 시안 제시(채팅). **(D)** 배포 준비: `git init`+초기 커밋(61파일, 루트 stale 중복·zip은 .gitignore로 제외). 남은 배포=공개 GitHub push(사용자 승인 필요)→KC Git 소스 빌드→정식 Inspector→임시등록. R-DOC: 07/08. D-115.
- 2026-06-27 (이어서6): **200+ 실사용 시나리오 테스트(서브에이전트) + 반영.** 🔴 0건(크래시·계산·PII·면책 무결, 16유형/오행/충합 일관). 🟡 수정: **데일리 럭키 매일 변주**(고정→도움/일진 오행 시드)·헤드라인 5/밴드·궁합 띠라벨 이중출력·궁합 공유문구 관계별·연운 에러중복·이름 보완 다양화. **빌드+56테스트+스모크 OK**(궁합 라벨 클린·럭키 토 변주 확인). **GitHub 공개 repo push**(`bb4rjfl/saju-concierge`). R-DOC: 07/08. D-117.
- 2026-06-27 (이어서7): **KC 배포 성공.** PlayMCP in KC Git 소스 빌드 → **Active (ID 751)**, Endpoint `https://saju-concierge.playmcp-endpoint.kakaocloud.io/mcp`. 헬스 `GET /`={tools:7,status:ok}. **배포 URL 대상 SDK 스모크(=Inspector 동급) 전 7툴 통과**(tools/list·desc<1024·annotations5·실호출 렌더). `/check` 전 항목 통과(라이선스 AGPL 0). 다음=**playmcp.kakao.com 임시등록**(엔드포인트 정보 불러오기→임시등록→대화예시 3개[docs/10]→테스트→심사요청 ≤7/7).
- 2026-06-27 (이어서5): **출품 강화 1+2+3 완료.** (1) 콘텐츠 깊이(데일리 풀 시드변주·16유형 연애/일/조언·궁합 캐치프레이즈). (2) 정확성 감수=합격(백그라운드 에이전트: 113매핑·충합 12×12 오류 0·16유형 균형) + 폴리시 2. (3) 적대적 QA(백그라운드 에이전트 92케이스) → 🔴 **raw -32602 누출**(숫자 min/max/int 제약이 SDK단에서 친절 폴백 무력화) 발견 → **birthShape 숫자필드 coerce+제약제거, 검증을 birthToProfile/엔진의 한글 RangeError로 이전.** + 엔진 영문에러 한글화(chart.ts 래핑), PII 숫자열 프로필코드 차단(profile.sanitize), 이름 10자 캡, getTodayFortune/findAuspiciousDate 잘못된 날짜·달 안내, "좋은날 좋은날" 중복 수정, getYearlyFortune targetYear coerce+isSupportedYear 가드. **테스트 47→56·빌드OK·SDK 스모크 -32602 0건 확인.** R-DOC: 07/08. D-116.
- 2026-06-27 (이어서8): **2차 종합 QA(다른 각도) + 궁합 대칭성 수정.** opus 분류기 불가로 서브에이전트 대신 직접 하니스 실행. ①882 시나리오(단발·입력모드·멀티턴24[코드재사용·띠일관100%]·공유→수신자 루프[7툴 CLOSED]·적대60)→실버그 0. ②2차 하니스(대칭성·입춘/자시 경계·윤달/윤일·같은날 50명 편차·다년연운·이름 된소리/받침·결정론·코드왕복)→ **🟡 궁합 비대칭 28/28 발견 → 시드 순서무관화 수정(D-118)**, 그 외(입춘 전환·윤일 2000/2004계산·1900/2001거부·결정론·왕복) 전부 정상. **빌드+57테스트(대칭성 회귀 추가) OK.** 신선도: 럭키 색 5종 변주·16유형 16종 균형·이름보완 분산·궁합 캐치 127/200.
- 2026-06-27 (이어서9): **재배포 편의 위해 컨테이너 이미지+Actions 전환(D-119).** Git 소스 빌드는 중지→시작으로 새 커밋 반영 안 됨(라이브 74/72 확인). `.github/workflows/deploy-image.yml` 추가(main push→linux/amd64 빌드→public ghcr `ghcr.io/bb4rjfl/saju-concierge:latest`+sha, GITHUB_TOKEN만·시크릿 0, GIT_SHA 주입→헬스로 빌드확인). **절차**: ①Actions 초록 ②ghcr 패키지 public 1회 전환 ③KC 기존 git saju 삭제 ④'컨테이너 이미지' 재등록(host `ghcr.io`·image `bb4rjfl/saju-concierge`·tag `latest`·인증 공백) ⑤Active→라이브 대칭성 검증. 이후 재배포=push→KC 중지→시작.
- 2026-06-27 (이어서10): **컨테이너 이미지 재배포 완료·라이브 검증 ✅.** ghcr public 전환 → KC 기존 git saju 삭제 → 컨테이너 이미지 등록(ID 768, 엔드포인트 동일 `https://saju-concierge.playmcp-endpoint.kakaocloud.io/mcp`) → Active. **라이브: 헬스 build=`7afbac7`(sha 주입)·7툴·궁합 74/74 대칭(수정 반영)·날씨 라이브(서울 21°C 구름조금·미세먼지).** 재배포 루프 확립(push→Actions ghcr:latest→KC 중지/시작). 워크플로우 `paths-ignore`(docs/**,md)로 문서 커밋은 빌드 제외. **다음=PlayMCP(playmcp.kakao.com) 임시등록 → 대화예시 3(docs/10) → 심사요청(≤7/7).**
- 2026-06-29 (이어서11): **PlayMCP 등록·도구함 추가 완료 + 핸드오프 문서.** playmcp.kakao.com 임시등록(사주 컨시어지, 식별자 sajuConcierge, 대화예시 3·대표이미지=자체제작 `saju-concierge-cover.png` 1200²), **도구함 추가(Tools 7 Online) → Claude 커넥터로 사주 툴 직접 호출 가능.** KC는 컨테이너 이미지(ID 768) 재배포·라이브검증(궁합 74/74 대칭·날씨·build sha). **`docs/11_handoff.md` 신설**(새 세션 진입점, 풍부한 맥락판) + CLAUDE §1에 연결. 남은 핵심=심사요청(≤7/7)→전체공개→비즈폼(≤7/14). 컨텍스트 한계로 대화창 이전.
