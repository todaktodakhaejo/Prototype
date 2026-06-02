// Vibration API 기반 햅틱 피드백.
// 컨셉: 실제 말랑이/슬라임을 만지는 듯한 "섬세한" 촉각. 과도한 진동보다 짧고 약한 펄스 우선.
// 미지원 환경(데스크톱 대부분·iOS Safari 등)에서는 오류 없이 조용히 무시한다.

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

// 모든 진동의 단일 진입점 — 미지원/예외(일부 브라우저는 제스처 밖 호출 시 throw) 시 no-op.
export function vibrate(pattern: number | number[]): void {
  if (!canVibrate()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* 무시 */
  }
}

export function stopVibration(): void {
  if (!canVibrate()) return
  try {
    navigator.vibrate(0)
  } catch {
    /* 무시 */
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// (1) 공이 벽에 부딪힐 때 — 충돌 강도(0~1)에 따라 진동 길이를 6~28ms로 차등.
//     세게 박을수록 길게, 살짝 닿으면 톡.
export function hapticWallHit(strength: number): void {
  const s = clamp(strength, 0, 1)
  vibrate(Math.round(6 + s * 22))
}

// (2a) 누르는 순간 — 매우 짧은 단발(톡).
export function hapticPress(): void {
  vibrate(7)
}

// (2b) 손을 떼는 순간 — "삐-용" 두 박자 패턴(짧게→쉼→길게)으로 누름과 명확히 구분.
export function hapticRelease(): void {
  vibrate([10, 24, 22])
}

// (3) 문지를 때 — 약한 단발 펄스. 호출 빈도(거리 기반)로 속도감을 표현한다.
//     빠를수록 자주 호출되어 진동 빈도가 올라간다.
export function hapticRubTick(): void {
  vibrate(5)
}
