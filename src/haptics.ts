// Vibration API 기반 햅틱 피드백.
// 컨셉: 실제 말랑이/슬라임을 만지는 듯한 촉각.
// ⚠️ 폰 체감: 안드로이드 진동 모터는 스핀업 시간 때문에 ~10ms 미만 펄스는 거의 안 느껴진다.
//    그래서 탭은 최소 ~22ms, 이벤트는 더 길게 잡아 폰에서도 확실히 느껴지도록 한다.
// 미지원 환경(데스크톱 대부분·iOS Safari 등)에서는 오류 없이 조용히 무시한다.

import * as sfx from './sfx'

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
  vibrate(Math.round(20 + s * 45))
  sfx.sfxWall(s)
}

// (2a) 누르는 순간 — 또렷한 단발(톡).
export function hapticPress(): void {
  vibrate(24)
  sfx.sfxPress()
}

// (2b) 손을 떼는 순간 — "삐-용" 두 박자 패턴(짧게→쉼→길게)으로 누름과 명확히 구분.
export function hapticRelease(): void {
  vibrate([24, 40, 60])
  sfx.sfxRelease()
}

// (3) 문지를 때 — 단발 펄스. 호출 빈도(거리 기반)로 속도감을 표현한다.
//     빠를수록 자주 호출되어 진동 빈도가 올라간다.
export function hapticRubTick(): void {
  vibrate(15)
  sfx.sfxRub()
}

// ── 의식(리츄얼) 단계 햅틱 ──────────────────────────────────────────

// 파쇄기 — 갈리는 동안 잘게 끊기는 단발(호출 빈도로 갈림 강도 표현).
export function hapticShredTick(): void {
  vibrate(13)
  sfx.sfxShredGrind()
}

// 파쇄기 — 다 갈려 폭죽처럼 터질 때 성공 진동(들썩이는 리듬).
export function hapticShredBurst(): void {
  vibrate([50, 30, 32, 50, 26, 64, 42])
  sfx.sfxShredBurst()
}

// 태우기 — 일정한 톡. 세기는 그대로 두고 '호출 간격'을 위로 갈수록 좁혀
//   진동 빈도가 점점 잦아지게 한다(호출 측에서 간격 제어).
export function hapticBurnTick(): void {
  vibrate(26)
  sfx.sfxBurn()
}

// 날리기 — 당기는 동안의 긴장감. 당김 세기(0~1)에 따라 길어지는 펄스.
export function hapticTension(power: number): void {
  const p = clamp(power, 0, 1)
  vibrate(Math.round(12 + p * 20))
  sfx.sfxTension(p)
}

// 날리기 — 손을 놓아 발사되는 순간의 한 방(세기에 비례).
export function hapticLaunch(power: number): void {
  const p = clamp(power, 0, 1)
  vibrate(Math.round(32 + p * 48))
  sfx.sfxLaunch(p)
}

// 보석함 — 편지를 함에 넣는 순간의 부드러운 진동(두 톡).
export function hapticJewelStore(): void {
  vibrate([28, 40, 40])
  sfx.sfxJewelStore()
}

// 보석함 — 후광이 빛날 때 심장박동(두근). 두근(lub-dub) × 3회.
//   휴지를 넉넉히(≈0.76s) 두어 "두근 … 두근 … 두근" 으로 느긋하면서도 확실히 느껴지게.
export function hapticHeartbeat(): void {
  vibrate([45, 90, 34, 760, 45, 90, 34, 760, 45, 90, 34])
  sfx.sfxHaloShimmer()
}
