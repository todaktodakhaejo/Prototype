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
  ritualsThisSession: number // 이번 세션에서 완료한 의식 수 (허브 안내용)

  // FSM 전환 액션 (단방향)
  completeOnboarding: () => void
  submitMoodPre: (value: number) => void
  proceedFromHome: () => void // 공놀이 후: 글 있으면 허브로, 없으면 분기 팝업(KPI)/글쓰기
  chooseRitual: () => void // 팝업 '감정 쓰고 흘려보낼래요' → 글쓰기
  chooseEndNow: () => void // 팝업 '오늘은 여기까지' → 공놀이만 기분 post
  setDraft: (text: string) => void
  goPickRitual: () => void // 다 적었어요 → 의식 허브
  pickRitual: (id: RitualId) => void
  finishRitual: () => void
  // 의식 허브(자유 흐름) 내비
  editWriting: () => void // 글 다시 쓰기
  backToPlay: () => void // 공놀이로 더
  finishSession: () => void // 이제 마칠래요 → 마친 후 기분
  afterAfterglow: () => void // 잔상 후 (KPI: 의식 허브로 복귀 / 아니면 완료 화면)
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
      ritualsThisSession: 0,
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
    ritualsThisSession: 0,

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

    // 공놀이를 마치고 다음으로 — 이미 쓴 글이 있으면 의식 허브로 곧장,
    // 아니면 첫 분기(KPI: 글쓸지/끝낼지 팝업, 비KPI: 바로 글쓰기)
    proceedFromHome: () => {
      if (get().draftText.trim().length > 0) {
        set({ step: 'RITUAL_PICK' }) // 허브로 복귀 (공놀이 더 하다 돌아온 경우)
      } else {
        set({ step: KPI_ENABLED ? 'RITUAL_PROMPT' : 'WRITE' })
      }
    },

    // 팝업: 감정 쓰고 흘려보낼래요 → 글쓰기 (pre는 이미 시작 전에 받음)
    chooseRitual: () => set({ step: 'WRITE' }),

    // 팝업: 오늘은 여기까지 → 공놀이만(글·의식 없음) 기분 post → 응답 시 처음으로
    chooseEndNow: () => set({ step: 'MOOD_POST', postRoundType: 'ball_only' }),

    setDraft: (text) => set({ draftText: text }),

    // 다 적었어요 → 의식 허브 (여기서 의식을 여러 번 고를 수 있음)
    goPickRitual: () => {
      kpi.markTextWritten(get().draftText.trim().length)
      set({ step: 'RITUAL_PICK' })
    },

    // ── 의식 허브 내비 (자유 흐름) ──
    editWriting: () => set({ step: 'WRITE' }), // 같은 글 편집/새로 쓰기
    backToPlay: () => set({ step: 'HOME' }), // 공놀이 더 (돌아오면 다시 허브)
    finishSession: () => set({ step: 'MOOD_POST', postRoundType: 'full' }), // 이제 마칠래요

    pickRitual: (id) => {
      kpi.ritualStart(id)
      set({ selectedRitual: id, step: 'RITUAL_ACT' })
    },

    finishRitual: () => {
      const id = get().selectedRitual
      if (id) kpi.ritualEnd(id)
      set({ step: 'AFTERGLOW', ritualsThisSession: get().ritualsThisSession + 1 })
    },

    // 잔상(AFTERGLOW) 이후 — KPI면 의식 허브로 복귀(또 고를 수 있게), 아니면 완료 화면
    afterAfterglow: () => {
      if (KPI_ENABLED) {
        set({ step: 'RITUAL_PICK', selectedRitual: null })
      } else {
        set({ step: 'RELEASED' })
      }
    },

    // 마친 후 기분 응답 → 완료(RELEASED) 화면으로. roundType은 세션 내용으로 자동 판정.
    submitMoodPost: (value) => {
      kpi.setMoodPost(value)
      const summary = kpi.endRound() // full/write_only/ball_only 자동 결정
      // 의식을 1개+ 한 세션만 '흘려보낸 마음' 카운트 +1
      if (summary && summary.roundType === 'full') {
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
        set({ step: 'MOOD_PRE', draftText: '', selectedRitual: null, postRoundType: null, ritualsThisSession: 0 })
      } else {
        resetForNext(true)
      }
    },

    resetHome: () => resetForNext(true),
  }
})
