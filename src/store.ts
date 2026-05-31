import { create } from 'zustand'
import type { Step, RitualId } from './types'
import * as kpi from './analytics'
import { KPI_ENABLED } from './analytics'

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

// 라운드 시작점(KPI 모드면 기분 pre부터, 아니면 홈) 결정
function entryStep(): Step {
  if (!readBool(LS_ONBOARDED)) return 'ONBOARDING'
  if (KPI_ENABLED) {
    kpi.startRound()
    return 'MOOD_PRE'
  }
  return 'HOME'
}

interface AppState {
  step: Step
  draftText: string // 작성 텍스트 — 세션 동안만 보유, 저장하지 않음
  selectedRitual: RitualId | null
  releaseCount: number
  onboarded: boolean
  postRoundType: kpi.RoundType | null // MOOD_POST가 어느 경로에서 왔는지

  // FSM 전환 액션 (단방향)
  completeOnboarding: () => void
  submitMoodPre: (value: number) => void
  proceedFromHome: () => void // 공놀이 후: KPI면 분기 팝업, 아니면 바로 글쓰기
  chooseRitual: () => void // 팝업 '리츄얼까지 해볼래요' → 글쓰기·의식 진행
  chooseEndNow: () => void // 팝업 '오늘은 여기까지 할래요' → 바로 기분 post
  setDraft: (text: string) => void
  goPickRitual: () => void
  pickRitual: (id: RitualId) => void
  finishRitual: () => void
  goReleased: () => void
  afterReleased: () => void // Released 여운 종료 후 (KPI: 기분 post / 아니면 홈 리셋)
  submitMoodPost: (value: number) => void // 응답 후 종료(ENDED)
  startNewRound: () => void // 종료 화면에서 다시 시작 (새 라운드)
  resetHome: () => void
}

export const useStore = create<AppState>((set, get) => {
  // 다음 라운드 준비 — 텍스트 폐기, 카운터 처리, KPI면 새 라운드+기분 pre
  function resetForNext(incrementCount: boolean) {
    const next = incrementCount ? get().releaseCount + 1 : get().releaseCount
    if (incrementCount) {
      try {
        localStorage.setItem(LS_COUNT, String(next))
      } catch {
        /* noop */
      }
    }
    if (KPI_ENABLED) kpi.startRound()
    set({
      step: KPI_ENABLED ? 'MOOD_PRE' : 'HOME',
      draftText: '', // 흘려보냈으니 텍스트 폐기 (저장하지 않음)
      selectedRitual: null,
      postRoundType: null,
      releaseCount: next,
    })
  }

  return {
    step: entryStep(),
    draftText: '',
    selectedRitual: null,
    releaseCount: readCount(),
    onboarded: readBool(LS_ONBOARDED),
    postRoundType: null,

    completeOnboarding: () => {
      try {
        localStorage.setItem(LS_ONBOARDED, '1')
      } catch {
        /* noop */
      }
      if (KPI_ENABLED) kpi.startRound()
      set({ onboarded: true, step: KPI_ENABLED ? 'MOOD_PRE' : 'HOME' })
    },

    submitMoodPre: (value) => {
      kpi.setMoodPre(value)
      set({ step: 'HOME' })
    },

    // 공놀이를 마치고 다음으로 — KPI면 분기 팝업, 아니면 곧장 글쓰기
    proceedFromHome: () => set({ step: KPI_ENABLED ? 'RITUAL_PROMPT' : 'WRITE' }),

    // 팝업: 리츄얼까지 → 글쓰기·의식 진행 (이후 RELEASED → 기분 post)
    chooseRitual: () => set({ step: 'WRITE' }),

    // 팝업: 오늘은 여기까지 → 공놀이만 한 라운드로 바로 기분 post
    chooseEndNow: () => set({ step: 'MOOD_POST', postRoundType: 'ball_only' }),

    setDraft: (text) => set({ draftText: text }),

    goPickRitual: () => {
      kpi.markTextWritten(get().draftText.trim().length)
      set({ step: 'RITUAL_PICK' })
    },

    pickRitual: (id) => {
      kpi.ritualStart(id)
      set({ selectedRitual: id, step: 'RITUAL_ACT' })
    },

    finishRitual: () => {
      const id = get().selectedRitual
      if (id) kpi.ritualEnd(id)
      set({ step: 'AFTERGLOW' })
    },

    goReleased: () => set({ step: 'RELEASED' }),

    afterReleased: () => {
      if (KPI_ENABLED) {
        set({ step: 'MOOD_POST', postRoundType: 'full' })
      } else {
        resetForNext(true)
      }
    },

    submitMoodPost: (value) => {
      kpi.setMoodPost(value)
      const rt = get().postRoundType ?? 'full'
      kpi.endRound(rt)
      // 의식까지 완료(full)한 라운드만 '흘려보낸 마음' 카운트 +1
      if (rt === 'full') {
        const next = get().releaseCount + 1
        try {
          localStorage.setItem(LS_COUNT, String(next))
        } catch {
          /* noop */
        }
        set({ releaseCount: next })
      }
      // 응답 후 종료 — 같은 질문이 곧바로 또 뜨지 않도록 다음 라운드 자동 시작 안 함
      set({ step: 'ENDED' })
    },

    // 종료 화면에서 사용자가 명시적으로 다시 시작할 때만 새 라운드(기분 pre부터)
    startNewRound: () => {
      if (KPI_ENABLED) kpi.startRound()
      set({
        step: KPI_ENABLED ? 'MOOD_PRE' : 'HOME',
        draftText: '',
        selectedRitual: null,
        postRoundType: null,
      })
    },

    resetHome: () => resetForNext(true),
  }
})
