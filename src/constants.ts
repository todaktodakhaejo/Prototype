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

// MVP 의식 3종
export const RITUALS: RitualMeta[] = [
  { id: 'burn', label: '태우기', emoji: '🔥', hint: '태워서 흘려보내요' },
  { id: 'crumple', label: '구기기', emoji: '🌀', hint: '구겨서 날려보내요' },
  { id: 'tear', label: '찢기', emoji: '🌸', hint: '찢어서 흩날려요' },
]
