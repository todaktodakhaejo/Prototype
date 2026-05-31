// 플로우 단계(FSM) — URL 라우트가 아니라 단계 상태값
// MOOD_PRE/MOOD_POST는 KPI 모드(프로토타입 한정)에서만 등장한다.
export type Step =
  | 'ONBOARDING'
  | 'MOOD_PRE'
  | 'HOME'
  | 'WRITE'
  | 'RITUAL_PICK'
  | 'RITUAL_ACT'
  | 'AFTERGLOW'
  | 'RELEASED'
  | 'MOOD_POST'

// MVP 의식 3종 (모두 흘려보내기/소멸형)
export type RitualId = 'burn' | 'crumple' | 'tear'

export interface RitualMeta {
  id: RitualId
  label: string
  emoji: string
  hint: string
}

// 시간대 5구간
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night' | 'pre-dawn'
