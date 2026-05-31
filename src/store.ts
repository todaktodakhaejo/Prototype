import { create } from 'zustand'
import type { Step, RitualId } from './types'

const LS_ONBOARDED = 'heulim.onboarded'
const LS_COUNT = 'heulim.releaseCount'

function readBool(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}
function readCount(): number {
  try {
    return Number(localStorage.getItem(LS_COUNT) ?? '0') || 0
  } catch {
    return 0
  }
}

interface AppState {
  step: Step
  draftText: string // 작성 텍스트 — 세션 동안만 보유, 저장하지 않음
  selectedRitual: RitualId | null
  releaseCount: number
  onboarded: boolean

  // FSM 전환 액션 (단방향)
  completeOnboarding: () => void
  enterWrite: () => void
  setDraft: (text: string) => void
  goPickRitual: () => void
  pickRitual: (id: RitualId) => void
  finishRitual: () => void
  goReleased: () => void
  resetHome: () => void
}

export const useStore = create<AppState>((set, get) => ({
  step: readBool(LS_ONBOARDED) ? 'HOME' : 'ONBOARDING',
  draftText: '',
  selectedRitual: null,
  releaseCount: readCount(),
  onboarded: readBool(LS_ONBOARDED),

  completeOnboarding: () => {
    try {
      localStorage.setItem(LS_ONBOARDED, '1')
    } catch {
      /* noop */
    }
    set({ onboarded: true, step: 'HOME' })
  },

  enterWrite: () => set({ step: 'WRITE' }),
  setDraft: (text) => set({ draftText: text }),
  goPickRitual: () => set({ step: 'RITUAL_PICK' }),
  pickRitual: (id) => set({ selectedRitual: id, step: 'RITUAL_ACT' }),
  finishRitual: () => set({ step: 'AFTERGLOW' }),
  goReleased: () => set({ step: 'RELEASED' }),

  resetHome: () => {
    const next = get().releaseCount + 1
    try {
      localStorage.setItem(LS_COUNT, String(next))
    } catch {
      /* noop */
    }
    set({
      step: 'HOME',
      draftText: '', // 흘려보냈으니 텍스트 폐기 (저장하지 않음)
      selectedRitual: null,
      releaseCount: next,
    })
  },
}))
