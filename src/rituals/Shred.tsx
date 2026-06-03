import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import Gauge from './Gauge'
import { rotatingMessage, SHRED_MESSAGES } from '../constants'
import { hapticShredTick, hapticShredBurst, stopVibration } from '../haptics'

const GRIND_HAPTIC_PX = 26 // 갈기 진동 1펄스당 이동거리(px) — 빠를수록 촘촘

const CONFETTI = 88 // 4회 웨이브로 팡-팡-팡-팡 터짐
const WAVES = 4
const COLORS = ['#f4b8c7', '#d8b15a', '#fbf7f4', '#c9a7e0', '#9ad0d8', '#ffd24d', '#7ee0a0']
const GRIND_DIST = 2000 // 이만큼(px) 문질러야 다 갈림 (더 오래 문지르도록)
const TAP_BUMP = 0.025 // 탭/클릭 한 번마다 조금씩 갈림

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// 파쇄기 — 사용자가 손가락을 좌우로 '마구 문질러' 종이를 갈아 넣는다(직접 행위).
//  세게/많이 문지를수록 본체가 격하게 떨리고 종이가 빨려 들어간다. 다 갈리면 팝콘처럼 터짐.
export default function Shred({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('shred', SHRED_MESSAGES))
  const [progress, setProgress] = useState(0)
  const [grinding, setGrinding] = useState(false)
  const [done, setDone] = useState(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)
  const grindAcc = useRef(0) // 갈기 햅틱용 이동 누적거리

  // 다 갈리면 마무리 (fired 가드 + done deps 제외 → 타이머가 취소되지 않음)
  useEffect(() => {
    if (progress >= 1 && !fired.current) {
      fired.current = true
      setDone(true)
      setGrinding(false)
      // 폭죽 4회에 맞춰 성공 진동도 팡-팡-팡-팡(점점 세게)
      hapticShredBurst()
      const b1 = window.setTimeout(hapticShredBurst, 420)
      const b2 = window.setTimeout(hapticShredBurst, 840)
      const b3 = window.setTimeout(hapticShredBurst, 1260)
      const t = setTimeout(onDone, 4600)
      return () => {
        clearTimeout(t)
        clearTimeout(b1)
        clearTimeout(b2)
        clearTimeout(b3)
      }
    }
  }, [progress, onDone])

  // 화면 이탈 시 진동 정리
  useEffect(() => () => stopVibration(), [])

  const onMove = (e: React.PointerEvent) => {
    if (!grinding || done) return
    const p = { x: e.clientX, y: e.clientY }
    if (last.current) {
      const d = Math.abs(p.x - last.current.x) + Math.abs(p.y - last.current.y)
      setProgress((v) => Math.min(1, v + d / GRIND_DIST))
      // 갈리는 동안 잘게 끊기는 진동 — 이동 누적거리마다 한 펄스
      grindAcc.current += d
      if (grindAcc.current >= GRIND_HAPTIC_PX) {
        grindAcc.current = 0
        hapticShredTick()
      }
    }
    last.current = p
  }

  const start = (e: React.PointerEvent) => {
    if (done) return
    // 포인터 캡처: 손가락/마우스가 요소 밖으로 나가도 move가 계속 잡힘(연속 드래그)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    setGrinding(true)
    last.current = { x: e.clientX, y: e.clientY }
    setProgress((v) => Math.min(1, v + TAP_BUMP)) // 탭만 해도 조금씩 갈림
  }
  const stop = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    setGrinding(false)
    last.current = null
  }

  const fed = progress * 138 // 종이가 슬롯으로 들어간 정도(px) — progress=1에서 정확히 다 들어가도록(게이지와 싱크)
  // 좌우로 확 휘청이며 점점 더 격하게(끝으로 갈수록 폭·속도 증가)
  const amp = 12 + progress * 52 // 좌우 흔들림 폭 12→64px (제자리 아닌 확실한 좌우 이동)
  const rot = 1.5 + progress * 5 // 회전 폭 1.5→6.5deg
  const shakeDur = Math.max(0.11, 0.4 - progress * 0.26) // 빨라짐

  return (
    <div
      style={{ position: 'relative', width: 240, height: 280, touchAction: 'none', cursor: done ? 'default' : 'grab' }}
      onPointerDown={start}
      onPointerMove={onMove}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {/* 종이(글) — 슬롯 높이에서 클립. 문지른 만큼 투입구로 빨려 들어감 */}
      <div
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140, overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 6,
            width: 90,
            height: 116,
            marginLeft: -45,
            padding: '12px 10px',
            borderRadius: 4,
            background: 'var(--paper)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            fontFamily: 'var(--batang)',
            fontSize: 10,
            lineHeight: 1.6,
            color: 'var(--ink)',
            textAlign: 'left',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            transform: `translateY(${fed}px)`,
          }}
        >
          {text}
        </div>
      </div>

      {/* 파쇄기 본체 — 가는 동안 격하게 흔들림 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 50,
          width: 222,
          height: 120,
          marginLeft: -111,
          zIndex: 2,
          borderRadius: 16,
          background: 'linear-gradient(180deg, #4a4754 0%, #2c2a34 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 18px 34px rgba(0,0,0,0.4)',
        }}
        animate={
          grinding
            ? {
                x: [0, -amp, amp, -amp, amp, -amp * 0.7, amp * 0.7, 0],
                rotate: [0, -rot, rot, -rot, rot * 0.8, -rot * 0.6, 0],
              }
            : { x: 0, rotate: 0 }
        }
        transition={grinding ? { duration: shakeDur, repeat: Infinity, ease: 'linear' } : { duration: 0.15 }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 18,
            width: 162,
            height: 10,
            marginLeft: -81,
            borderRadius: 5,
            background: '#15131a',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.65)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: grinding ? '#ffd24d' : '#7ee0a0',
            boxShadow: grinding ? '0 0 10px 3px rgba(255,200,80,0.9)' : '0 0 8px 2px rgba(126,224,160,0.7)',
          }}
        />
      </motion.div>

      {/* 폭죽 — 다 갈리면 팝콘처럼 터짐 */}
      {done &&
        Array.from({ length: CONFETTI }).map((_, i) => {
          const wave = i % WAVES // 0,1,2 — 세 번에 나눠 빵빵빵
          const sx = (rnd(i) - 0.5) * 360 // 더 넓게 사방으로
          const up = 160 + rnd(i + 7) * 200 // 더 높이
          const fall = 120 + rnd(i + 13) * 140
          const dly = wave * 0.42 + rnd(i + 3) * 0.14 // 웨이브별 0.42s 간격, 각 웨이브는 촘촘히(팡!)
          const dur = 1.0 + rnd(i + 5) * 0.55
          const spin = (rnd(i + 9) < 0.5 ? -1 : 1) * (340 + rnd(i + 11) * 320)
          const sz = 7 + Math.round(rnd(i + 17) * 6) // 더 큰 조각
          return (
            <motion.span
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 156,
                width: sz,
                height: Math.round(sz * 2.1),
                marginLeft: -sz / 2,
                borderRadius: 2,
                background: COLORS[i % COLORS.length],
                boxShadow: '0 0 6px rgba(255,255,255,0.35)',
                zIndex: 3,
              }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
              animate={{
                x: [0, sx * 0.5, sx * 0.85, sx],
                y: [0, -up, -up * 0.25, fall],
                opacity: [0, 1, 1, 0],
                rotate: [0, spin * 0.4, spin * 0.8, spin],
                scale: [0.4, 1.3, 1.05, 0.85],
              }}
              transition={{ duration: dur, delay: dly, times: [0, 0.32, 0.66, 1], ease: 'easeOut' }}
            />
          )
        })}

      {/* 진행 게이지 — 문지른 정도(progress)에 직결, 다 차면 완료 */}
      {!done && <Gauge value={progress} from="#b78bd6" to="#f4b8c7" />}

      {/* 상단 행위 안내 캡션 */}
      {!done && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {progress > 0.02 ? '더 세게 문질러 갈아요' : '🗑️ 좌우로 마구 문질러 갈아보세요'}
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {done && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
