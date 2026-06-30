# 11. 핸드오프 — 다음 세션 진입점 (아주 풍부한 맥락판)

> **이 문서는 새 대화창이 "이것만 읽고도" 끊김 없이 이어가도록** 쓴 자기완결적 핸드오프다(R-DOC-5).
> 작성: 2026-06-29. 작성자: 직전 세션(Claude).
> **새 세션은 순서대로**: ① 이 문서 → ② `docs/08_progress.md`(SSOT, 항상 최신 진실) → ③ `CLAUDE.md` → 필요 시 docs/01·05. `/sync`도 가능.

---

## 0. ⚠️ 가장 먼저 알아야 할 것 — "연속성/실제 상태 확인"

이 프로젝트는 여러 대화창을 거쳐 왔고, **대화창에 로드된 컨텍스트가 실제 repo/디스크보다 뒤처지는 일이 반복**됐다. (이전 세션이 커밋·배포까지 해놨는데 새 창은 옛 상태로 시작하는 식.)
**그래서 새 세션은 절대 추측하지 말고, 시작 시 반드시 실제 상태부터 확인:**
```bash
git -C "C:/Users/user/Claude/Projects/사주" log --oneline -8
git -C "C:/Users/user/Claude/Projects/사주" status -sb
```
+ `docs/08_progress.md` 세션 로그 맨 아래(가장 최신 "이어서N") 확인. 이 둘이 진실이다. CLAUDE.md "현재 상태"가 어긋나면 docs/08 기준.

또 하나: **안전 분류기(claude-opus-4-8)가 간헐적으로 "temporarily unavailable"** 가 된다. 이때 **쓰기/실행/서브에이전트가 막힌다**(읽기·검색은 됨). → 잠깐 기다렸다 재시도하거나, 막히면 읽기전용 작업으로 우회하고 나중에. 서브에이전트가 안 되면 **직접 하니스 스크립트로 대체**(아래 QA 패턴 참고).

---

## 1. 한 문단 + 지금 정확히 어디

**Saju Concierge** = 생년월일시 → 만세력 명식 계산 → **오늘의 기운·궁합·사주 유형·올해 운세·이름풀이·택일**을 재미있게 풀어주는 **한국형 운세 MCP 서버**(TS+Node22, Streamable HTTP, stateless). 카카오 **Agentic Player 10** 공모전 2번째 출품작(1번째=Korea Trip Concierge, 별도 repo `kakaomcp1-kpass`). 목표=본선 진출·대상.

**지금 위치(파이프라인):**
- ✅ **개발 완료**: 7툴, 빌드 게이트 통과, **테스트 57개 통과**, 로컬 MCP 스모크 통과.
- ✅ **QA 완료**: 882 + 2차(다른 각도) 시나리오 스윕 → 발견 버그 전부 수정(아래 §9). 미해결 버그 0.
- ✅ **`/check` 통과**: 카카오 규칙·라이선스(AGPL 0) 전 항목 OK.
- ✅ **KC 배포 Active**: PlayMCP in KC, **컨테이너 이미지** 방식, 서버명 `saju-concierge`(ID 768), Endpoint `https://saju-concierge.playmcp-endpoint.kakaocloud.io/mcp`. 라이브 검증 통과(궁합 대칭 74/74·날씨·헬스 build sha).
- ✅ **PlayMCP 등록(playmcp.kakao.com)**: 임시 등록 + **도구함 추가 완료**(Tools 7, MCP Online). 대화예시 3개 + 대표 이미지 등록함. **→ Claude 커넥터(PlayMCP)로 사주 툴 호출 가능**(다음 세션도 ToolSearch로 `사주 컨시어지: computeSajuChart` 등 사용 가능).
- ✅ **라이브 MCP 시나리오 QA 라운드(2026-06-29, D-120)**: 도구함 커넥터로 배포본 직접 호출 ~80건 + 하니스 324건 → **324/324 PASS**(크래시·-32602·PII·kakao누출·24k·대칭불일치 0, 16유형 도달, 인젝션 면역). 폴리시 8종 수정(F-1~F-8): F-7🔴 interpretName PII숫자 에코 차단, F-5 궁합 하트 구간화, 나머지 코스메틱. **빌드+테스트 63 green.** 툴/스키마 불변(재심사 아님).
- ✅ **칩 생존 fix(2026-06-30, D-124)**: 플레이그라운드 실측서 호스트 LLM이 "눌러서 이어가기" 푸터·칩·공유카드를 재작성 과정에 드롭 확인 → kpass D-031/D-033 포팅(`footer.ts`에 조합 LLM **명시 지시문** + `💬 다음으로 물어보세요`, 백틱·UI-메타 제거). getTodayFortune 본문 이어가기 줄(D-122) 제거. 테스트 74. ⚠️**재배포 후 플레이그라운드 재검증 필요**(지시문이 실제로 칩을 surface시키는지).
- ✅ **입력 위생 강화(2026-06-29, D-123)**: location/occupation 자유텍스트의 따옴표·세미콜론·슬래시·백틱·`|` 등 제거(허용문자만 유지)·표시값까지 정제(`cleanText`). 무해했으나 공유 코드/카드 청결. 테스트 73.
- ✅ **오늘의 기운 카드 UX 강화(2026-06-29, D-122)**: 실사용 AI채팅 피드백 → 오행 이모지·종합평(분야별 행동 가이드)·"나와 잘 맞는 인연"(일지 합 띠+기운+행동)·본문 이어가기 칩. ⚠️**중요 발견**: PlayMCP AI채팅은 응답 **푸터(공유카드·칩·사주코드)를 LLM 요약 과정에서 잘라냄** → 차별화 요소(칩/공유)는 **본문에도** 넣어야 노출됨. 테스트 67→70.
- ✅ **2차 라이브 QA(2026-06-29, 서브에이전트 ~210건, D-121)**: 신규 시나리오 🔴 0(F-1~F-8 유지·15/16유형·궁합 하트 전구간). 발견·수정: **음력 12월(섣달) 입력이 라이브러리 한계로 전부 거부**되던 것 → `solarToLunar` 역탐색 폴백으로 정상화(`engine/chart.ts`). 테스트 63→67. (서브에이전트의 윤달 실패 주장은 오인—정상 확인.)
- 🔶 **재배포 대기(D-120·D-121 라이브 반영)**: `git push`(완료 시) → Actions ghcr:latest → **KC 콘솔 `saju-concierge` 중지→시작** → health `build` sha=최신 확인. 이 한 단계(중지→시작)는 사용자 콘솔 작업.
- ⛔ **아직 안 한 것(= 남은 핵심)**: **심사 요청(≤7/7)** → 승인 → **전체 공개** → **비즈폼 "Player 예선 참여"(≤7/14, 최대 2개, 1회 제출)**.

**마감(중요)**: 심사요청 **≤2026-07-07**(심사 최대 7일, 7/7 요청분만 기한보장) / 비즈폼 **≤2026-07-14**. 오늘 2026-06-29 기준 여유 있음.

---

## 2. 환경·계정·좌표 (그대로 씀)

- **repo**: `https://github.com/bb4rjfl/saju-concierge` (public, branch `main`). 로컬 `C:\Users\user\Claude\Projects\사주`.
- **gh CLI**: `bb4rjfl` 계정으로 인증돼 있음(repo/Actions/ghcr 조작 가능, 단 토큰에 read:packages 스코프는 없음 — 패키지 가시성 API 조회는 불가).
- **ghcr 이미지**: `ghcr.io/bb4rjfl/saju-concierge:latest`(+:sha). **public**으로 전환돼 있음(KC가 인증 없이 pull). GitHub Actions `.github/workflows/deploy-image.yml`가 main push 시 자동 빌드(linux/amd64)·푸시. `GIT_SHA` build-arg 주입 → 헬스 `/`의 `build` 필드로 어떤 커밋이 라이브인지 확인 가능.
- **KC**: playmcp.kakaocloud.io. 서버 `saju-concierge` ID **768**, namespace `kbm-u-4961514721`, author `4961514721`. (계정당 2대: 1대=korea-trip-concierge, 2대=saju.)
- **PlayMCP(공모전 등록)**: playmcp.kakao.com. 팀프로필/작성자 **강상호**. MCP 이름 `사주 컨시어지`, 식별자 `sajuConcierge`(추정 — 등록폼에서 넣음). 심사/결과 알림은 **카카오 대표이메일(fortenball@gmail.com)** 로 옴.
- **대표 이미지**: `C:\Users\user\Claude\Projects\사주\saju-concierge-cover.png`(1200×1200, 자체 제작, repo엔 미포함). 원하면 색/문구 조정 가능.
- ⚠️ **사이트 2개 구분**: `playmcp.kakaocloud.io`=KC 호스팅(서버 띄우는 곳) / `playmcp.kakao.com`=공모전 등록·마켓(심사·공개).

---

## 3. 제품 전략 — 우리가 함께 정한 것 (차별화가 생명)

**"빈 땅"이 아니다.** PlayMCP에 이미 사주 MCP가 있다: **1FATE '정통 명리학'**(격국·용신·신살48·12운성 — 딥 테크 명리), **사주봄**(쉬운 사주·오늘/띠별/행운시간). 심사정책상 **"명칭·문구·출력형식만 바꾼 클론은 반려"** → 차별화는 생존조건.

**우리 포지션(확정, D-108·D-113·D-114)**: 정통/전문도, "쉬운 사주"(사주봄이 선점)도 아니다. →
> **"사주를 풀어주는 분석가"가 아니라 "사주로 오늘을 운영하게 해주는 데일리 비서."**

이걸 구현하는 시그니처:
1. **데일리 럭키 키트**(getTodayFortune) — 점수+키워드(애정/재물/일/건강)+**럭키 색/숫자/방향/음식/시간대**+do&don't, **매일 변주**(질리지 않게), (선택)위치 시 **날씨·미세먼지**(키없는 Open-Meteo). "매일 아침 카톡으로 받기" 넛지.
2. **사주 16유형**(analyzePersonality) — MBTI식 4축(음양/신강신약/식상vs관성/목화vs금수) → 별명·연애/일/조언. 공유·바이럴.
3. **공유용 궁합 카드**(getCompatibility) — 점수·하트·캐치프레이즈("단단한 쇠 같은 말띠 ✕ 물처럼 유연한 원숭이띠"). 카톡 공유.
4. **택일**(findAuspiciousDate) — 경쟁자 0인 "한눈에 다름". 개인 명식 충 회피+손없는날+목적별 가중. **단 메인 아님**(리텐션 약 — 사용자 지시).
5. **이름풀이**(interpretName), **명식**(computeSajuChart), **올해 운세**(getYearlyFortune).
6. **모든 결과에 "공유 카드 + 바이럴 훅"**(`lib/share.ts`): 귀여운 카드 UI + **공유받은 사람용 "나도 보기" CTA**(예 "오늘 내 운세 봐줘") + 서비스명 → 공유받은 사람이 바로 우리 서비스로 유입(공개투표 모수↑). QA로 7툴 전부 루프 닫힘 확인.
7. **무저장·stateless·프로필 코드**(`SC1|...`) — 재입력 0, 서버 저장 0, 개인정보 6종 미수집.

**리텐션(매일 카톡 발송) 진실**: MCP 서버는 스스로 푸시 못 함(요청-응답). 카카오 공식 패턴 = **에이전트(OpenClaw/Claude/ChatGPT)가 스케줄로 우리 툴을 매일 호출 → '나와의 채팅'에 전달**. 그래서 우리 서버는 **"스케줄 친화적 단일 호출"만 잘하면 됨**(이미 그렇게 설계). 이메일 발송은 드롭(개인정보·정보통신망법·백엔드 부담). 친구/단톡 발송은 OAuth로 막혀 본인 나챗방만.

---

## 4. 아키텍처 / 코드 지도

스택: TypeScript + Node22, `@modelcontextprotocol/sdk` v1.29, **express5**, **zod**, `@fullstackfamily/manseryeok`(MIT, 1900~2050 만세력). 전부 MIT/ISC/BSD(AGPL 0).

```
src/
  server.ts            express5, POST /mcp(요청마다 McpServer+StreamableHTTPServerTransport, stateless),
                       GET /(헬스 {name,version,build,tools,status}), GET/DELETE /mcp→405. 시작 시 assertNamingOk.
  lib/
    constants.ts       SERVER_NAME=saju-concierge, SERVICE_NAME="Saju Concierge(사주 컨시어지)", 24k 상수, DISCLAIMER
    naming.ts          kakao 금지·이름규칙·3~20개 빌드게이트(assertNamingOk)
    markdown.ts        renderMarkdown(24k 가드: 본문 잘라도 footer 생존), textResult
    footer.ts          buildChoiceFooter(한글 칩 2~4개, "눌러서 이어가기 👇")
    responses.ts       ok(body,choices,share?)=본문+공유카드+면책+칩(24k가드) / fail(친절 에러) / notConnected
    share.ts           buildShareCard(귀여운 카드 + "나도 보기" 수신자 CTA + 서비스명) ← 바이럴
    weather.ts         fetchWeather(Open-Meteo 무키, 한글도시→로컬좌표표+지오코딩폴백, 2.5s, NODE_ENV=test 스킵), weatherLine
    env.ts             ENV.PORT/GIT_SHA (외부 키 없음) / loadEnv.ts (.env 로더, server.ts 최상단 import)
  engine/              결정론·순수함수(테스트·재현 가능) = 우리 해자
    elements.ts        천간10/지지12 오행·음양·띠, generates/controls(상생상극), sipsinOf(십신), categoryOf/categoryFor
    chart.ts           birthToProfile(범위검증→한글 RangeError), computeChart(manseryeok 래퍼; 영문에러는 한글 RangeError로 래핑), chartFromBirth
    profile.ts         프로필코드 SC1| 인코딩/디코딩, normalizeGender, sanitize(숫자4+연속=PII로 보고 드롭)
    daily.ts           computeDailyKit(일진 vs 일간 → 점수·키워드·럭키·do/don't, 시드 변주), koreaToday
    personality.ts     computeSajuType(16유형 4축, 성향축 동률 타이브레이크), computeGodCategories
    compat.ts          computeCompatibility(일간 오행관계+띠 합/충+보완, **순서무관 시드=대칭**, 캐치프레이즈)
    yearly.ts          computeYearlyFortune(세운+분기, isSupportedYear 가드)
    name.ts            readName(한글 초성 오행=훈민정음 오음, 10자 캡)
    auspicious.ts      computeAuspiciousDates(충 회피+손없는날[음력 끝 9·0]+목적 가중), normalizePurpose
  data/                자체 작성 해석 텍스트(출처 복붙 금지, 공개 명리 개념을 우리 문장으로)
    sipsin.ts(십신10) ohaeng.ts(오행5: 성격·색/숫자/방향/음식/계절·do/dont) sajuType.ts(16유형: 별명·태그·강점·주의·분야·연애·일·조언 + AXIS_META)
  tools/               각 ToolDef = {name, description(영문≤1024, 서비스명 포함), inputSchema(zod), annotations(5종), handler}
    _shared.ts         birthShape(공통 입력; 숫자는 z.coerce.number().optional() — min/max/int 금지!), resolveChart, BIRTH_PROMPT_*
    index.ts           ALL_TOOLS(7), TOOL_NAMES
    computeSajuChart / getTodayFortune / analyzePersonality / getCompatibility / getYearlyFortune / interpretName / findAuspiciousDate
scripts/  lint-naming.ts(빌드게이트), smoke.ts(SDK 클라이언트 스모크 — MCP_URL로 배포본도 점검)
test/     engine·interpret·compat·extra·auspicious·qa (vitest, 57개)
Dockerfile(--platform=linux/amd64, 멀티스테이지)  .github/workflows/deploy-image.yml(ghcr 자동빌드)
docs/01~10 + 이 문서(11)
```

**annotations idempotentHint**: 명식/유형/이름/궁합=`true`(같은 입력→같은 결과), 오늘/올해/택일=`false`(날짜 의존). openWorldHint: getTodayFortune만 `true`(날씨 외부호출), 나머지 false.

---

## 5. 배포 파이프라인 & 라이브 검증 (이게 한동안 제일 헷갈렸음 — 정독)

**왜 컨테이너 이미지로 갔나(D-119)**: 처음엔 "키 0개라 단순" 이유로 **Git 소스 빌드**를 썼는데(D-106), **KC가 새 커밋을 쉽게 재빌드 못 함**(중지→시작으로 반영 안 됨 — 라이브 74/72로 확인). → **컨테이너 이미지 + GitHub Actions(public ghcr)** 로 전환. 키 0개라 kpass의 비공개 ghcr보다 단순.

**재배포 루프(앞으로 이대로):**
1. 코드 수정 → `git push`(main) → **Actions가 자동으로 `ghcr.io/bb4rjfl/saju-concierge:latest` 빌드·푸시**. (`gh -R bb4rjfl/saju-concierge run watch <id> --exit-status` 로 완료 확인)
2. **KC 콘솔에서 `saju-concierge` 중지→시작**(latest 재pull). ← 이 한 동작은 사용자 콘솔 작업(내가 대신 못 함: KC 로그인 필요).
3. 라이브 검증(아래).
- 문서/`.md`만 바꾼 커밋은 `paths-ignore`로 **이미지 빌드 안 탐**(불필요한 재배포 방지).
- ⚠️ **MCP 연결로는 재배포 불가**: PlayMCP 커넥터는 "사주 *툴 호출*"이지 인프라 제어가 아니다. 재빌드/중지/시작은 KC 콘솔(사용자 계정) 영역.

**라이브 검증 스니펫**(임시 `_live.mts` 만들어 `npx tsx` 후 삭제):
```ts
// 헬스 build sha(=최신커밋인지) + 궁합 대칭(73/73류) + 날씨
const base="https://saju-concierge.playmcp-endpoint.kakaocloud.io";
const h=await (await fetch(base+"/")).json();           // build 필드가 최신 sha면 OK
// SDK Client+StreamableHTTPClientTransport(new URL(base+"/mcp")) → listTools(7), getCompatibility 두 순서 점수 비교
```
또는 도구함 연결됐으니 **PlayMCP 커넥터로 사주 툴을 직접 호출**해 눈으로 확인해도 됨.

---

## 6. 남은 일 (우선순위 — 제출까지)

1. **(선택이지만 권장) 심사요청 직전 "라이브=최신" 확인**: 마지막 코드 변경이 있었다면 §5 재배포 후 health build sha가 최신 커밋인지 확인. (지금은 라이브가 이미 수정 반영된 상태.)
2. **PlayMCP에서 도구함/AI채팅으로 충분히 테스트** (대화예시 3개 흐름 + 칩 여정 + 공유 카드). 막다른 칩·이상 출력 없나 사람 눈으로.
3. **심사 요청** (≤7/7). ❗심사요청 누르기 전 **7툴 셋 확정**(등록 후 툴 변경 시 "정보 불러오기"=재심사 트리거). description에 정확한 툴 개수 쓰지 말 것.
4. 승인 메일 → **공개 상태 "나에게만" → "전체 공개"** → 상세페이지 URL 복사.
5. **비즈폼 "Player 예선 참여"** 제출(≤7/14, 최대 2개=korea-trip+saju 동시, **1회 제출**).
6. ⚠️ **비즈 정보 심사는 별개 게이트**(kpass 경험): 사업자 정보 + 서비스 화면 캡처가 필요했고 2번 반려됨(미검증 사업자번호/빈약한 화면). 미리 준비.

---

## 7. 작업 규칙 / 상시 지킬 것 (어기지 말 것)

- **R-DOC**: 규칙/스펙/툴/데이터/결정 바뀌면 **같은 작업에서** 해당 docs + `07_decision_log`(D-1xx) + `08_progress`(SSOT) 갱신. 문서 없는 코드변경 금지. 세션 끝/배포단계면 핸드오프 문서 갱신(이 문서처럼).
- **검증 루프**: `npm run build`(네이밍게이트+tsc) → `npm test`(vitest) → 필요시 `scripts/smoke.ts`. 다 green 아니면 배포·등록 금지.
- **R-AMD64**: Dockerfile/이미지 `linux/amd64`(arm64=KC 활성화 실패).
- **카카오 규칙(docs/01)**: 서버명·툴명 `kakao` 금지(빌드게이트), 툴 3~10, annotations 5종, **영문 description ≤1024 + 서비스명 포함**, 응답 **Markdown TextContent ≤24k**(API원문 금지), p99 3s, 광고/리워드 금지, **개인정보 6종 금지**, "LLM 웹검색만으로 가능" 금지(우리 해자=만세력+자체해석), **클론 금지**, 대표이미지 정적(움짤 금지), 엔터테인먼트 톤(단정예언·공포 금지)+면책.
- **입력 스키마 함정(중대·QA로 학습)**: 사용자 자유입력 필드에 **`z.enum()`/`.min()/.max()/.int()` 쓰지 말 것** → 위반 시 **MCP SDK가 핸들러 전에 raw `-32602`+Zod JSON을 클라이언트로 누출**(친절 카드 무력화). → **`z.coerce.number().optional()` 등으로 받고, 범위 검증은 엔진에서 한글 `RangeError`로**. (birthShape가 이 패턴.) 엔진의 영문 에러도 한글로 래핑(chart.ts 참고).
- **라이선스(R-LICENSE)**: 새 의존성은 라이선스 확인 후만(MIT/Apache/BSD/ISC). **AGPL/GPL/SSPL 금지**(orrery·Swiss Ephemeris 코드 금지 — 공식·개념만 참고, 코드 복붙 금지). 해석 데이터는 자체 문장(사이트 복붙 금지).
- **계산/해석 분리**: 명식·십신·오행·충합은 결정론 코드(engine), 표현 톤만 LLM. → 순수함수로 테스트 락.
- **idempotentHint/description ↔ 실제동작 1:1**(미구현 기능 광고 금지).
- **git**: 커밋만(요청 시 push). 메시지 끝 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Windows라 `git -c core.autocrlf=false commit`(CRLF 경고는 무해, repo엔 LF 저장). 공개 push는 사용자 승인 받았음(이미 origin 설정·진행 중).
- **임시 QA/검증 하니스 패턴**: 프로젝트 루트에 `_xxx.mts` 만들어 핸들러/엔드포인트 호출 → 결과 보고 → **실행 후 삭제**(repo 오염 금지). `process.env.NODE_ENV='test'`로 날씨 네트워크 스킵.
- **분류기 다운 대응**: opus-4-8 불가 시 쓰기/실행/서브에이전트 막힘 → 잠깐 후 재시도 or 직접 수행(서브에이전트 대신 하니스).

---

## 8. 신경 쓸 함정 (실제로 부딪힌 것들)

- **연속성**(§0): 실제 git/디스크가 대화 컨텍스트보다 앞설 수 있음 → 항상 실제 상태부터.
- **KC 재배포**: Git 소스 빌드는 중지→시작으로 재빌드 안 됨(그래서 컨테이너 이미지로 전환). 컨테이너 이미지는 중지→시작=latest 재pull로 반영.
- **ghcr 패키지 가시성**: Actions로 만든 패키지는 기본 private → KC가 무인증 pull 하려면 **public 전환 필요**(이미 함). private 유지 시 KC 폼에 read:packages PAT 필요.
- **노션 접근**: 연결된 Notion MCP는 개인 워크스페이스('K')라 카카오 PlayMCP 노션 페이지 404. 원문은 **Claude-in-Chrome으로 렌더링**해 읽었음(공개 단축링크 kko.kakao.com/playmcp_guide 등). 규칙은 docs/01과 일치 확인됨.
- **응답 크기**: 공식=24k(노션 원문 확인). 우리 응답 ~1~2k라 여유. 일부 커뮤니티가 20k라 했으나 24k가 맞음.
- **manseryeok**: `calculateSaju`/`solarToLunar(→.lunar/.gapja.dayPillar)`/`lunarToSolar(→.solar)`/`isSupportedYear`/`getSupportedRange`. dayPillar는 한글 간지. 시 모름이면 hourPillar null. 영문 에러(Invalid solar date 등)는 engine에서 한글로 래핑.
- **PlayMCP**: "정보 불러오기" 성공해야 등록 가능. "임시 등록" 먼저(절대 "등록 및 심사요청" 먼저 X). 도구함의 temp MCP는 본인만 사용. AI채팅 동시 10 MCP. 대화예시 최대 3.

---

## 9. QA 상태 (무엇을 검증했나)

두 차례 대규모 스윕(분류기 불가 시 직접 하니스로). **미해결 버그 0, 심사 제출 가능 품질.**
- **882 시나리오**(단발·입력모드·멀티턴24[코드재사용·띠일관100%]·**공유→수신자 루프 7툴 CLOSED**·적대60) → 실버그 0.
- **2차(다른 각도)**: 궁합 대칭성·입춘/자시 경계·윤달/윤일·같은날 50명 편차·다년 연운·이름 된소리/받침·결정론·코드왕복 → **🟡 궁합 비대칭 발견→수정(D-118, 순서무관 시드)**, 나머지 전부 정상.
- 그동안 고친 것들: raw -32602 누출 차단(스키마→엔진 검증, D-116), 엔진 영문에러 한글화, PII 프로필코드 차단, 이름 10자 캡, 잘못된 날짜/달 친절 안내, 궁합 띠라벨 이중출력·공유문구 관계별·연운 에러중복, 데일리 럭키 매일 변주·헤드라인 5/밴드(D-117), 정확성 감수 합격(113매핑·충합 12×12 오류 0, 16유형 균형).
- 정확성 감수 결론: 명식·십신·오행·충합·초성오행·오행대응표 전부 표준과 일치(엔터테인먼트 톤 기준 충분).

---

## 10. 앞으로 하면 좋을 것 (지시 안 받았지만 가치 있음)

- **본선 Kakao Tools Widget**(7/30~8/27 본선 단계, 필수 추가개발). 이번에 **귀여운 카드 비주얼 시안**을 채팅으로 제시해뒀음(오늘의 기운/유형/궁합 카드) → 그게 위젯 청사진. 예선은 텍스트 카드 유지.
- **데일리 콘텐츠 더 확장**: 헤드라인 60일 distinct 26 → 풀 더 키우면 40+로. 도메인 문구 풀·세운 변주도. 매일 재방문의 핵심.
- **스케줄→카톡 데일리 발송** 시연: 에이전트(OpenClaw/Claude tasks)로 "매일 8시 오늘의 기운 카톡" 데모 → 본선 투표 임팩트. (서버는 이미 단일호출 준비됨.)
- **공유성/대표이미지 변형**, **신살/대운 살짝 추가**(과하면 복잡·불안), **이름 한자 수리(획수)**(한자 사전 필요), **타로**(보조, 카드 이미지 저작권 텍스트만) — 전부 선택.
- **비즈폼/사업자 정보·서비스 화면** 미리 준비(별개 심사 게이트).
- **license-checker를 CI에 추가**(AGPL 자동 차단) — 선택.

---

## 11. 빠른 명령 모음

```bash
# 빌드·테스트
npm run build && npm test
# 로컬 스모크(서버 띄운 뒤) 또는 배포본
node dist/server.js  &  npx tsx scripts/smoke.ts        # MCP_URL=https://.../mcp 로 배포본 점검
# Actions 상태
gh -R bb4rjfl/saju-concierge run list --workflow=deploy-image.yml --limit 3
# 라이브 헬스(빌드 sha 확인)
curl https://saju-concierge.playmcp-endpoint.kakaocloud.io/
```
재배포 = `git push` → Actions 초록 → **KC 콘솔에서 saju-concierge 중지→시작** → 라이브 검증.

---

## 12. 슬래시 커맨드 / 진입
`/sync`(컨텍스트 로드) · `/check`(응모 전 점검) · `/newtool`(툴 추가) · `/handoff`(세션 종료 갱신). **다음 세션은 이 문서 + docs/08부터.**
