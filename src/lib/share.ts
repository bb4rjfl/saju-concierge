/**
 * 공유 카드 — 모든 툴 결과 끝에 붙는 "복사해서 친구에게 보내기" 블록.
 *
 * 핵심 2가지(사용자 요구):
 *  1) 귀여운 카드 UI (이모지 프레임 — 한글 폭에 안전하도록 고정폭 박스 대신 이모지 라인).
 *  2) **바이럴 루프**: 공유받은 사람도 바로 우리 서비스를 쓰도록 유도하는 CTA
 *     (AI에게 무슨 말을 하면 되는지 + 서비스명). 예선엔 클릭 버튼이 없으므로
 *     "복붙 + 따라 말하기"가 현실적 공유 메커닉(본선 Kakao Tools Widget에서 버튼화).
 */

const RULE = "˗ˏˋ ☆ ˎˊ˗  ✦  ˗ˏˋ ☆ ˎˊ˗";

export interface ShareCard {
  emoji: string;
  /** 카드 제목 (예: "오늘의 기운"). */
  title: string;
  /** 압축 요약 줄 2~4개 (이모지 포함). */
  lines: string[];
  /** 공유받은 사람이 AI에게 그대로 말하면 똑같이 써볼 수 있는 문구. */
  tryPhrase: string;
}

export function buildShareCard(c: ShareCard): string {
  return [
    "---",
    "📤 **공유하기** — 아래 카드를 복사해 친구에게 보내요",
    "",
    RULE,
    `${c.emoji} **${c.title}**`,
    ...c.lines,
    "",
    `🔮 _나도 보고 싶다면?_ AI에게 **\`${c.tryPhrase}\`** 라고 말해보세요`,
    "_✨ Saju Concierge(사주 컨시어지)에서 봤어요_",
    RULE,
  ].join("\n");
}
