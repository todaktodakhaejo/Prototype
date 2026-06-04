// PostHog 연동 (웹 SDK) — 구글시트 KPI와 '병행'.
//   VITE_POSTHOG_KEY 가 있으면 초기화되고, 없으면 전부 no-op(안전: 키 없으면 아무 일도 안 함).
//   - distinct_id = 우리 익명 uid 로 묶어 리텐션/사용자 단위 분석 가능
//   - 화면 전환(screen_view) + 라운드 완료(kpi_round) 이벤트로 퍼널/지표 구성
import posthog from 'posthog-js'

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
// phc_… 는 브라우저에 노출되도록 설계된 '공개 클라이언트 토큰'이라 코드에 둬도 안전.
// (필요하면 Vercel 환경변수 VITE_POSTHOG_KEY/HOST 로 덮어쓸 수 있음)
const KEY = env.VITE_POSTHOG_KEY || 'phc_rL4xbEAoGxPxbfgE7ZLvs77zDYBABEu6CPARPL56YD9B'
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
  } catch {
    /* 키 오류 등은 조용히 무시 */
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
