import type { RitualMeta } from './types'

// 의식 진행 후 잔상 → 완료 타이밍 (테스트 중 쉽게 조정)
export const AFTERGLOW_MS = 1500 // 잔상 지속
export const RELEASE_PAUSE_MS = 1500 // 완료 직전 빈 화면 여운

// 홈 공 롱프레스 → 글쓰기 진입 임계 시간
export const LONG_PRESS_MS = 800

// 홈 위로 멘트 후보
export const COMFORT_MESSAGES = [
  '마음보다 손이 먼저 가도 괜찮아요',
  '여기 있어요',
  '뭐든 괜찮아요',
]

// 의식 목록 (선택 그리드 노출 순서)
export const RITUALS: RitualMeta[] = [
  { id: 'burn', label: '태우기', emoji: '🔥', hint: '태워서 흘려보내요' },
  { id: 'shred', label: '파쇄기', emoji: '🗑️', hint: '갈아서 날려버려요' },
  { id: 'plane', label: '날리기', emoji: '✈️', hint: '접어서 날려보내요' },
  { id: 'jewelbox', label: '보석함', emoji: '💎', hint: '보석함에 간직해요' },
]
