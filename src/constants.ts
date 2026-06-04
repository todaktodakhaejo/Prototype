import type { RitualMeta } from './types'

// 의식 진행 후 잔상 → 완료 타이밍 (테스트 중 쉽게 조정)
export const AFTERGLOW_MS = 1500 // 잔상 지속
export const RELEASE_PAUSE_MS = 1500 // 완료 직전 빈 화면 여운

// 홈 공 롱프레스 → 글쓰기 진입 임계 시간
export const LONG_PRESS_MS = 800

// ── KPI 모드(프로토타입 한정) 기분 측정 ──
export const MOOD_MAX = 10 // 0~10 척도 (0=매우 안 좋다 ~ 10=매우 좋다 — 높을수록 좋음)
// (1) 공놀이 전(시작)
export const MOOD_PRE_TITLE = '시작 전, 지금 기분이 어떤가요?'
// (2) 공놀이만 하고 마침
export const MOOD_POST_BALL_TITLE = '감정말랑이를\n만나고 난 지금, 기분이 어떤가요?'
// (3) 환기(리츄얼)까지 하고 마침
export const MOOD_POST_RITUAL_TITLE = '환기를 마친 지금, 기분이 어떤가요?'
export const MOOD_LOW_LABEL = '매우 안 좋다' // 0
export const MOOD_HIGH_LABEL = '매우 좋다' // 10

// 공놀이 후 분기 팝업 (종이/리츄얼 진입 전)
export const RITUAL_PROMPT_TITLE = '오늘의 마음,\n환기해볼까요?'
export const RITUAL_PROMPT_YES = '네, 환기해볼래요'
export const RITUAL_PROMPT_NO = '오늘은 여기까지 할래요'

// 환기 1회 후 분기 (더 할지 / 여기까지 — 여기까지면 후속 기분 질문)
export const RITUAL_AGAIN_TITLE = '환기가 끝났어요.\n더 해볼까요?'
export const RITUAL_AGAIN_MORE = '환기 더 하기'
export const RITUAL_AGAIN_END = '오늘은 여기까지 할래요'

// 완료(RELEASED) 화면 멘트 — 환기까지 한 경우 / 공놀이만 한 경우 구분
export const RELEASED_TITLE = '환기가 끝났어요' // 환기(의식)까지 마친 경로
export const RELEASED_TITLE_BALL = '마음을 토닥였어요' // 공놀이만 한 경로(환기 아님)
export const RELEASED_SUBTITLE = '처음으로 돌아가요'

// ── 의식 완료 멘트 (의식별 3종, 할 때마다 번갈아 노출) ──
export const BURN_MESSAGES = [
  '어느덧 작은 한 줌이 되었네요',
  '끝까지 잘 탔습니다',
  '열심히 태웠습니다',
]
export const SHRED_MESSAGES = [
  '산산이 부서졌어요, 한결 가볍죠',
  '이제 아무도 못 읽어요',
  '조각조각, 시원하게 보냈어요',
]
export const PLANE_MESSAGES = [
  '멀리 날려 보냈어요, 잘 가요',
  '바람이 알아서 데려갈 거예요',
  '손을 떠났어요, 한결 가볍죠',
]
export const JEWELBOX_MESSAGES = [
  '예쁘게 넣어 두었어요',
  '여기 잘 간직할게요',
  '반짝— 소중히 담았어요',
]

// 의식별 회전 인덱스(localStorage)로 매번 다른 멘트를 고른다.
// 컴포넌트 마운트 시 useState 초기화로 1회만 호출할 것(렌더마다 호출 금지).
export function rotatingMessage(key: string, arr: string[]): string {
  try {
    const k = `heulim.msg.${key}`
    const i = (Number(localStorage.getItem(k)) || 0) % arr.length
    localStorage.setItem(k, String((i + 1) % arr.length))
    return arr[i]
  } catch {
    return arr[0]
  }
}

// 말랑이(오브제) 멘트 — 온보딩(순환) + 홈(라운드별 1개) 공용. 두 줄 구성.
export const COMFORT_MESSAGES = [
  '오늘도 이것저것 많이 담고 오셨네요.\n일단 저한테 좀 넘겨보실래요?',
  '걱정은 머리에서 나오지만,\n의외로 손에서 풀리기도 해요.',
  '오늘 하루, 얼마나 단단했나요?\n일단 저부터 말랑해질게요.',
  '앗, 오셨어요!\n오늘의 꾹꾹이를 기다리고 있었어요.',
  '걱정은 잠시 여기 두고 가세요.\n제가 깔고 앉아 있을게요.',
  '손이 심심해 보이네요.\n저를 한 번 눌러보실래요?',
  '마음이 복잡한 날에도,\n말랑이는 원래 말랑해요.',
]

// 의식 목록 (선택 그리드 노출 순서)
export const RITUALS: RitualMeta[] = [
  { id: 'burn', label: '태우기', emoji: '🔥', hint: '태워서 흘려보내요' },
  { id: 'shred', label: '파쇄기', emoji: '🗑️', hint: '갈아서 날려버려요' },
  { id: 'plane', label: '날리기', emoji: '✈️', hint: '접어서 날려보내요' },
  { id: 'jewelbox', label: '보석함', emoji: '💎', hint: '보석함에 간직해요' },
]
