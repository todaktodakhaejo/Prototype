import { create } from 'zustand'
import type { Step, RitualId } from './types'
import * as kpi from './analytics'

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

// 라운드 시작점 — 온보딩 전이면 온보딩, 그 외엔 '무조건' 기분척도(MOOD_PRE)부터.
//   KPI 플래그와 무관하게 시작을 결정론적으로 고정한다(공이 먼저 뜨는 사례 방지).
//   kpi.startRound()은 KPI 비활성 시 내부에서 no-op이라 항상 호출해도 안전.
function entryStep(): Step {
  if (!readBool(LS_ONBOARDED)) return 'ONBOARDING'
  kpi.startRound()
  return 'MOOD_PRE'
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
  moreRitual: () => void // 환기 1회 후 '더 하기' → 의식 허브
  finishSession: () => void // 이제 마칠래요 → 마친 후 기분
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
    kpi.startRound()
    set({
      step: 'MOOD_PRE', // 다음 라운드도 항상 기분척도부터
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
      kpi.startRound()
      set({ onboarded: true, step: 'MOOD_PRE' })
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
        set({ step: 'RITUAL_PROMPT' }) // 항상 분기 팝업(환기할지/여기까지)
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
    moreRitual: () => set({ step: 'RITUAL_PICK' }), // 환기 더 하기 → 허브로
    finishSession: () => set({ step: 'MOOD_POST', postRoundType: 'full' }), // 이제 마칠래요

    pickRitual: (id) => {
      kpi.ritualStart(id)
      set({ selectedRitual: id, step: 'RITUAL_ACT' })
    },

    // 의식 연출 완료(컴포넌트가 자체 마무리 멘트까지 보여준 뒤 호출) →
    //   KPI: '더 할지/여기까지' 분기 화면으로(이탈 방지·후속 질문 유도) / 비KPI: 완료 화면
    finishRitual: () => {
      const id = get().selectedRitual
      if (id) kpi.ritualEnd(id)
      set({
        ritualsThisSession: get().ritualsThisSession + 1,
        selectedRitual: null,
        step: 'RITUAL_AGAIN', // 항상 '더 할지/여기까지' 분기 → 후속 기분질문 유도
      })
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

    // 완료 화면 여운 종료 후 — 항상 처음(공놀이 전 기분 pre)으로 되돌아간다
    afterReleased: () => {
      kpi.startRound()
      set({ step: 'MOOD_PRE', draftText: '', selectedRitual: null, postRoundType: null, ritualsThisSession: 0 })
    },

    resetHome: () => resetForNext(true),
  }
})
