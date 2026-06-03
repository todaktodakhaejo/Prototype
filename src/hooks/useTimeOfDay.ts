import { useState, useEffect } from 'react'
import type { TimeOfDay } from '../types'

// 와이어프레임 정의 5구간:
// dawn 05–07 · day 07–16 · dusk 16–19 · night 19–04 · pre-dawn 04–05
export function resolveTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 16) return 'day'
  if (hour >= 16 && hour < 19) return 'dusk'
  if (hour >= 4 && hour < 5) return 'pre-dawn'
  return 'night' // 19–04
}

// 미리보기용 강제 지정 — URL ?tod=night|day|dawn|dusk|pre-dawn 이면 그 시간대로 고정.
function overrideTod(): TimeOfDay | null {
  try {
    const v = new URLSearchParams(window.location.search).get('tod')
    if (v && ['dawn', 'day', 'dusk', 'night', 'pre-dawn'].includes(v)) return v as TimeOfDay
  } catch {
    /* noop */
  }
  return null
}

export function useTimeOfDay(): TimeOfDay {
  const [tod, setTod] = useState<TimeOfDay>(() => overrideTod() ?? resolveTimeOfDay(new Date().getHours()))

  useEffect(() => {
    if (overrideTod()) return // 고정 미리보기 중엔 시계 갱신 안 함
    // 1분마다 구간 재확인 (경계 넘어갈 때 갱신)
    const id = setInterval(() => {
      setTod(resolveTimeOfDay(new Date().getHours()))
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  return tod
}

export function formatToday(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}
