import type { RitualMeta } from './types'

// 의식 진행 후 잔상 → 완료 타이밍 (테스트 중 쉽게 조정)
export const AFTERGLOW_MS = 1500 // 잔상 지속
export const RELEASE_PAUSE_MS = 1500 // 완료 직전 빈 화면 여운

// 홈 공 롱프레스 → 글쓰기 진입 임계 시간
export const LONG_PRESS_MS = 800

// ── KPI 모드(프로토타입 한정) 기분 측정 ──
export const MOOD_MAX = 10 // 0~10 척도
export const MOOD_PRE_TITLE = '시작하기 전, 지금 마음의 무게는 어느 정도인가요?'
export const MOOD_POST_TITLE = '마치고 난 지금, 마음의 무게는 어느 정도인가요?'
export const MOOD_LOW_LABEL = '마음이 가벼움'
export const MOOD_HIGH_LABEL = '마음이 무거움'

// 공놀이 후 분기 팝업 (종이/리츄얼 진입 전)
export const RITUAL_PROMPT_TITLE = '감정을 기록하고 리츄얼과 함께 해소해볼까요?'
export const RITUAL_PROMPT_YES = '리츄얼까지 해볼래요'
export const RITUAL_PROMPT_NO = '오늘은 여기까지 할래요'

// 말랑이(오브제) 멘트 — 온보딩(순환) + 홈(라운드별 1개) 공용. 두 줄 구성.
export const COMFORT_MESSAGES = [
  '오늘도 이것저것 많이 담고 오셨네요.\n일단 저한테 좀 넘겨보실래요?',
  '걱정은 머리에서 나오지만,\n의외로 손에서 풀리기도 해요.',
  '오늘 하루, 얼마나 단단했나요?\n일단 저부터 말랑해질게요.',
  '꾹 눌러보세요.\n제가 대신 버텨볼게요.',
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
