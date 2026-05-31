import type { RitualMeta } from './types'

// 의식 진행 후 잔상 → 완료 타이밍 (테스트 중 쉽게 조정)
export const AFTERGLOW_MS = 1500 // 잔상 지속
export const RELEASE_PAUSE_MS = 1500 // 완료 직전 빈 화면 여운

// 홈 공 롱프레스 → 글쓰기 진입 임계 시간
export const LONG_PRESS_MS = 800

// ── KPI 모드(프로토타입 한정) 기분 측정 ──
export const MOOD_MAX = 10 // 0~10 척도
// 공놀이만 한 라운드도 기분(post)을 받기 위한 홈의 마침 버튼.
// 종료를 유도하지 않는 중립 멘트로 둔다.
export const KPI_DONE_LABEL = '기분 남기기'
export const MOOD_PRE_TITLE = '지금 마음의 무게는 어느 정도인가요?'
export const MOOD_POST_TITLE = '지금 마음의 무게는 어느 정도인가요?'
export const MOOD_LOW_LABEL = '가벼움'
export const MOOD_HIGH_LABEL = '무거움'

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
