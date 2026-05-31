// 플로우 단계(FSM) — URL 라우트가 아니라 단계 상태값
export type Step =
  | 'ONBOARDING'
  | 'HOME'
  | 'WRITE'
  | 'RITUAL_PICK'
  | 'RITUAL_ACT'
  | 'AFTERGLOW'
  | 'RELEASED'

// 의식 종류 — 흘려보내기(소멸형) + 보내기/보관형 연출
//   burn/shred/plane : 흘려보내기(감정이 떠나감)
//   jewelbox         : 보관형 연출(시각적으로만 — 텍스트는 저장하지 않음)
export type RitualId = 'burn' | 'shred' | 'plane' | 'jewelbox'

export interface RitualMeta {
  id: RitualId
  label: string
  emoji: string
  hint: string
}

// 시간대 5구간
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night' | 'pre-dawn'
