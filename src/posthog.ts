// PostHog 연동 (웹 SDK) — 구글시트 KPI와 '병행'.
//   VITE_POSTHOG_KEY 가 있으면 초기화되고, 없으면 전부 no-op(안전: 키 없으면 아무 일도 안 함).
//   - distinct_id = 우리 익명 uid 로 묶어 리텐션/사용자 단위 분석 가능
//   - 화면 전환(screen_view) + 라운드 완료(kpi_round) 이벤트로 퍼널/지표 구성
import posthog from 'posthog-js'

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
// phc_… 는 브라우저에 노출되도록 설계된 '공개 클라이언트 토큰'이라 코드에 둬도 안전.
// (필요하면 Vercel 환경변수 VITE_POSTHOG_KEY/HOST 로 덮어쓸 수 있음)
const KEY = env.VITE_POSTHOG_KEY || 'phc_yhUV7HG8UkVxQfzkfBUqmrrDLAQZKJkd8KxJUAvZregu' // 프로토타입 = 개인 계정 프로젝트 (본앱은 공용계정 별도)
const HOST = env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

export const POSTHOG_ENABLED = !!KEY
let ready = false

export function initPostHog(uid?: string): void {
  if (ready || !KEY || typeof window === 'undefined') return
  try {
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      autocapture: true,
    })
    if (uid) posthog.identify(uid)
    ready = true
    tagAudience()
  } catch {
    /* 키 오류 등은 조용히 무시 */
  }
}

// 내부(나·팀원) 식별: ?internal=1 (또는 ?team=1) 로 한 번 접속하면 그 브라우저는 영구히 '팀'으로 표시.
//  - 모든 이벤트에 is_team 속성(super property) → 분석 때 is_team!=true 로 진짜 사용자만 봄
//  - 팀이면 person 속성으로도 박아 그 사람의 '과거 데이터까지' 소급 제외 가능
function tagAudience() {
  let internal = false
  try {
    if (localStorage.getItem('heulim.internal') === '1') internal = true
    const p = new URLSearchParams(window.location.search)
    if (p.get('internal') === '1' || p.get('team') === '1') {
      internal = true
      localStorage.setItem('heulim.internal', '1')
    }
  } catch {
    /* noop */
  }
  try {
    posthog.register({ is_team: internal }) // 이후 모든 이벤트에 표식
    if (internal) posthog.setPersonProperties({ is_team: true }) // person 단위(소급 필터용)
  } catch {
    /* noop */
  }
}

export function phCapture(event: string, props?: Record<string, unknown>): void {
  if (!ready) return
  try {
    posthog.capture(event, props)
  } catch {
    /* noop */
  }
}

export function phIdentify(uid: string): void {
  if (!ready) return
  try {
    posthog.identify(uid)
  } catch {
    /* noop */
  }
}
