// ─────────────────────────────────────────────────────────────
// KPI 수집 모듈 (프로토타입 한정)
//
// 측정 대상:
//   (1) 라운드당 공놀이 활성 시간 — 공을 실제로 누르거나 끄는 동안만(가만히 있는 시간 제외)
//   (2) 라운드당 의식별 시간/횟수 — ritual id별로 일반화 계측(태우기·구기기·찢기, 의식 추가 시 자동 포함)
//   (+) 기분 pre/post 0~N 점 — 공놀이 전 / 활동 직후. 실시간 측정이라 회상 편향 없음.
//
// 단위 = "라운드"(MOOD_PRE→HOME→…→MOOD_POST 한 사이클). 한 번 켜고 여러 라운드 가능.
// 전송 = websocket이 아니라 배치 방식: 라운드 종료 시 localStorage에 적재 + (설정 시) HTTP 전송.
//        websocket은 상태 서버가 필요하고 모바일에서 끊겨 유실되기 쉬워 집계형 KPI엔 부적합.
// ─────────────────────────────────────────────────────────────

const LS_ROUNDS = 'heulim.kpi.rounds'
const LS_UID = 'heulim.kpi.uid'
const MAX_STORED = 500 // localStorage 무한 증가 방지

// Vite env: VITE_KPI_ENABLED='false'면 비활성(기본 활성), VITE_KPI_ENDPOINT 설정 시 HTTP 전송
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
export const KPI_ENABLED = env.VITE_KPI_ENABLED !== 'false'
const ENDPOINT = env.VITE_KPI_ENDPOINT

// full=의식 1개+ / write_only=글만 쓰고 의식 0 / ball_only=공놀이만 / abandoned=중간 이탈
export type RoundType = 'full' | 'write_only' | 'ball_only' | 'abandoned'

interface RitualStat {
  count: number
  totalMs: number
}

export interface RoundSummary {
  schema: 'heulim.kpi.round.v1'
  uid: string // 기기별 익명 식별자 (세션 간 결합용 join key)
  sessionId: string // 앱 1회 오픈당
  roundIndex: number // 세션 내 라운드 순번 (0부터)
  startedAt: number
  endedAt: number
  durationMs: number
  roundType: RoundType
  ballPlayActiveMs: number // (1) 공놀이 활성 시간 합 (idle 제외)
  ballPlayCount: number // 공놀이 상호작용(누름) 횟수
  rituals: Record<string, RitualStat> // (2) 의식별 시간/횟수 (세션 내 여러 의식 누적)
  ritualId: string | null // 마지막으로 완료한 의식
  ritualCount: number // 세션 내 완료한 의식 총 횟수
  ritualSequence: string[] // 의식을 한 순서 (예: ['burn','tear','jewelbox'])
  isTextWritten: boolean
  textLength: number
  moodPre: number | null // (+) 공놀이 전 기분
  moodPost: number | null // (+) 활동 직후 기분
  moodDelta: number | null // pre - post (양수 = 가벼워짐)
}

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* noop */
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function persistentUid(): string {
  try {
    let id = localStorage.getItem(LS_UID)
    if (!id) {
      id = uuid()
      localStorage.setItem(LS_UID, id)
    }
    return id
  } catch {
    return uuid()
  }
}

// ── 세션/라운드 상태 (모듈 싱글턴) ──
const SESSION_ID = uuid()
const UID = persistentUid()

interface CurrentRound {
  roundIndex: number
  startedAt: number
  ballPlayActiveMs: number
  ballPlayCount: number
  rituals: Record<string, RitualStat>
  ritualId: string | null
  ritualSequence: string[]
  isTextWritten: boolean
  textLength: number
  moodPre: number | null
  moodPost: number | null
  ritualStartTs: number | null
  ritualStartId: string | null
}

let current: CurrentRound | null = null
let roundCounter = 0

function readRounds(): RoundSummary[] {
  try {
    const raw = localStorage.getItem(LS_ROUNDS)
    return raw ? (JSON.parse(raw) as RoundSummary[]) : []
  } catch {
    return []
  }
}

function appendRound(round: RoundSummary) {
  try {
    const all = readRounds()
    all.push(round)
    if (all.length > MAX_STORED) all.splice(0, all.length - MAX_STORED)
    localStorage.setItem(LS_ROUNDS, JSON.stringify(all))
  } catch {
    /* localStorage 불가 환경은 무시 — HTTP 전송으로 보완 */
  }
}

function sendRound(round: RoundSummary) {
  if (!ENDPOINT) return
  const body = JSON.stringify(round)
  // text/plain = CORS 안전목록 타입 → 교차출처 POST가 프리플라이트 없이 전송됨
  // (구글 Apps Script 웹앱 등 doPost 엔드포인트로 바로 적재 가능). 본문은 JSON 문자열.
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }))
    } else {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* 전송 실패해도 localStorage 적재분으로 회수 가능 */
  }
}

// ── 공개 API ──

export function startRound() {
  if (!KPI_ENABLED) return
  current = {
    roundIndex: roundCounter++,
    startedAt: Date.now(),
    ballPlayActiveMs: 0,
    ballPlayCount: 0,
    rituals: {},
    ritualId: null,
    ritualSequence: [],
    isTextWritten: false,
    textLength: 0,
    moodPre: null,
    moodPost: null,
    ritualStartTs: null,
    ritualStartId: null,
  }
}

export function setMoodPre(value: number) {
  if (current) current.moodPre = value
}

export function setMoodPost(value: number) {
  if (current) current.moodPost = value
}

// 공놀이 활성 구간 1회분(ms) 누적 — JellyBall이 누름 해제마다 호출
export function addBallActive(ms: number) {
  if (current && ms > 0) {
    current.ballPlayActiveMs += ms
    current.ballPlayCount += 1
  }
}

export function markTextWritten(length: number) {
  if (current) {
    current.isTextWritten = true
    current.textLength = length
  }
}

export function ritualStart(id: string) {
  if (current) {
    current.ritualStartTs = Date.now()
    current.ritualStartId = id
  }
}

export function ritualEnd(id: string) {
  if (!current || current.ritualStartTs === null) return
  const ms = Date.now() - current.ritualStartTs
  const stat = current.rituals[id] ?? { count: 0, totalMs: 0 }
  stat.count += 1
  stat.totalMs += ms
  current.rituals[id] = stat
  current.ritualId = id
  current.ritualSequence.push(id)
  current.ritualStartTs = null
  current.ritualStartId = null
}

// force를 주면 그 유형으로(예: 'abandoned'), 아니면 세션 내용으로 자동 판정.
export function endRound(force?: RoundType): RoundSummary | null {
  if (!current) return null
  const endedAt = Date.now()
  const ritualCount = current.ritualSequence.length
  const moodDelta =
    current.moodPre !== null && current.moodPost !== null
      ? current.moodPre - current.moodPost
      : null
  const roundType: RoundType =
    force ?? (ritualCount > 0 ? 'full' : current.isTextWritten ? 'write_only' : 'ball_only')
  const summary: RoundSummary = {
    schema: 'heulim.kpi.round.v1',
    uid: UID,
    sessionId: SESSION_ID,
    roundIndex: current.roundIndex,
    startedAt: current.startedAt,
    endedAt,
    durationMs: endedAt - current.startedAt,
    roundType,
    ballPlayActiveMs: current.ballPlayActiveMs,
    ballPlayCount: current.ballPlayCount,
    rituals: current.rituals,
    ritualId: current.ritualId,
    ritualCount,
    ritualSequence: current.ritualSequence,
    isTextWritten: current.isTextWritten,
    textLength: current.textLength,
    moodPre: current.moodPre,
    moodPost: current.moodPost,
    moodDelta,
  }
  current = null
  appendRound(summary)
  sendRound(summary)
  // 테스트 중 즉시 확인용
  try {
    // eslint-disable-next-line no-console
    console.info('[KPI] round', summary)
  } catch {
    /* noop */
  }
  return summary
}

// ── 디버그/회수용 (테스트 진행자가 콘솔에서 사용) ──
function downloadJSON() {
  try {
    const blob = new Blob([JSON.stringify(readRounds(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `heulim-kpi-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    /* noop */
  }
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { __heulimKPI: unknown }).__heulimKPI = {
    get: readRounds,
    downloadJSON,
    clear: () => {
      try {
        localStorage.removeItem(LS_ROUNDS)
      } catch {
        /* noop */
      }
    },
    info: () => ({ uid: UID, sessionId: SESSION_ID, enabled: KPI_ENABLED, endpoint: ENDPOINT ?? null }),
  }

  // 라운드 진행 중 탭이 닫히면 유실 방지 — 미완료 라운드를 'abandoned'로 회수
  window.addEventListener('pagehide', () => {
    if (current) endRound('abandoned')
  })
}
