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

// 라운드 시작점 — KPI 모드면 공놀이 전 기분(MOOD_PRE)부터, 아니면 홈
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
  afterAfterglow: () => void // 잔상 후 (KPI: 마친 후 기분 post / 아니면 완료 화면)
  afterReleased: () => void // 완료(RELEASED) 화면 후 (KPI: 처음=기분 pre / 아니면 홈 리셋)
  submitMoodPost: (value: number) => void // 마친 후 기분 응답 → 완료(RELEASED) 화면
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

    // 기분 pre는 공놀이 시작 전(공통)에 물음 → 응답하면 홈(공놀이)으로
    submitMoodPre: (value) => {
      kpi.setMoodPre(value)
      set({ step: 'HOME' })
    },

    // 공놀이를 마치고 다음으로 — KPI면 분기 팝업, 아니면 곧장 글쓰기
    proceedFromHome: () => set({ step: KPI_ENABLED ? 'RITUAL_PROMPT' : 'WRITE' }),

    // 팝업: 리츄얼까지 → 글쓰기·의식 진행 (pre는 이미 시작 전에 받음)
    chooseRitual: () => set({ step: 'WRITE' }),

    // 팝업: 오늘은 여기까지 → 공놀이만 한 라운드의 기분 post(KPI) → 응답 시 홈으로
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

    // 잔상(AFTERGLOW) 이후 — KPI면 '마친 후 기분'을 먼저 묻고, 아니면 바로 완료 화면
    afterAfterglow: () => {
      if (KPI_ENABLED) {
        set({ step: 'MOOD_POST', postRoundType: 'full' })
      } else {
        set({ step: 'RELEASED' })
      }
    },

    // 마친 후 기분 응답 → 완료(RELEASED, "처음으로 돌아가요") 화면으로
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
      set({ step: 'RELEASED' })
    },

    // 완료 화면 여운 종료 후 — KPI면 처음(공놀이 전 기분 pre)으로, 아니면 홈 리셋
    afterReleased: () => {
      if (KPI_ENABLED) {
        kpi.startRound()
        set({ step: 'MOOD_PRE', draftText: '', selectedRitual: null, postRoundType: null })
      } else {
        resetForNext(true)
      }
    },

    resetHome: () => resetForNext(true),
  }
})
