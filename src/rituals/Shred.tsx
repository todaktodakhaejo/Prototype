import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import type { RitualProps } from './index'
import Gauge from './Gauge'
import { rotatingMessage, SHRED_MESSAGES } from '../constants'
import { hapticShredTick, hapticShredBurst, stopVibration } from '../haptics'

const GRIND_HAPTIC_PX = 26 // 갈기 진동 1펄스당 이동거리(px) — 빠를수록 촘촘

// 알록달록한 색종이(흰색=밤티 방지) — 폭죽처럼 터진다
const CONFETTI = ['#ff5e7e', '#ff9f3c', '#ffe14d', '#5ed87f', '#46c9e6', '#7c8cff', '#c46bff', '#ff7fc2']
// 모두 파쇄기 투입구(중앙)에서 '위로' 뿜어져 나오게 — 방금 간 종이가 색종이로 터져 나오는 연결감.
//   ox=투입구 근처 약한 좌우 흔들림, up=위로 솟는 분출 세기, 4번 연속 팡팡팡(각 웨이브마다 진동).
const SLOT_BOTTOM = 158 // 폭죽이 나오는 투입구 높이(파쇄기 윗부분)
const WAVES = [
  { ox: 0, n: 28, delay: 0.0, sp: 168, up: 120 },
  { ox: -12, n: 22, delay: 0.34, sp: 146, up: 100 },
  { ox: 14, n: 22, delay: 0.66, sp: 152, up: 108 },
  { ox: -4, n: 24, delay: 0.98, sp: 160, up: 114 },
]
const GRIND_DIST = 3400 // 이만큼(px) 문질러야 다 갈림 (더 오래 문지르도록 — 너무 빨리 안 끝나게)
const TAP_BUMP = 0.025 // 탭/클릭 한 번마다 조금씩 갈림

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

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
      // 폭죽이 4번 팡팡팡 — 각 웨이브 시점마다 진동 한 방씩
      hapticShredBurst() // wave 0
      const bursts = WAVES.slice(1).map((wv) => window.setTimeout(hapticShredBurst, Math.round(wv.delay * 1000)))
      const t = setTimeout(onDone, 3400)
      return () => {
        clearTimeout(t)
        bursts.forEach(clearTimeout)
      }
    }
  }, [progress, onDone])

  // 화면 이탈 시 진동 정리
  useEffect(() => () => stopVibration(), [])

  // 본체가 '드래그 방향을 그대로 따라' 기울고 이동(스프링) — 고정 키프레임 반복(부자연) 대신 직접 조작.
  const dragX = useMotionValue(0)
  const dragRot = useMotionValue(0)
  const bodyX = useSpring(dragX, { stiffness: 240, damping: 14, mass: 0.7 })
  const bodyRot = useSpring(dragRot, { stiffness: 240, damping: 14, mass: 0.7 })
  const lastMoveTs = useRef(0)

  // 손가락이 멈추면(최근 이동 없음) 목표를 0으로 감쇠 → 스프링이 중앙으로 부드럽게 복귀(seamless)
  useEffect(() => {
    if (!grinding) {
      dragX.set(0)
      dragRot.set(0)
      return
    }
    let raf = 0
    const tick = () => {
      if (Date.now() - lastMoveTs.current > 55) {
        dragX.set(dragX.get() * 0.8)
        dragRot.set(dragRot.get() * 0.8)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [grinding, dragX, dragRot])

  const onMove = (e: React.PointerEvent) => {
    if (!grinding || done) return
    const p = { x: e.clientX, y: e.clientY }
    if (last.current) {
      const dx = p.x - last.current.x
      const d = Math.abs(dx) + Math.abs(p.y - last.current.y)
      setProgress((v) => Math.min(1, v + d / GRIND_DIST))
      // 드래그한 방향·속도 그대로 본체가 따라감(끝으로 갈수록 더 크게 반응)
      const gain = 1.0 + progress * 0.7
      dragX.set(clamp(dragX.get() * 0.45 + dx * gain, -98, 98))
      dragRot.set(clamp(dragRot.get() * 0.45 + dx * 0.17 * gain, -14, 14))
      lastMoveTs.current = Date.now()
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

  return (
    <div
      style={{ position: 'relative', width: 240, height: 280, marginTop: 34, touchAction: 'none', cursor: done ? 'default' : 'grab' }}
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

      {/* 파쇄기 본체 — 드래그 방향을 그대로 따라 기울고 이동(스프링), 멈추면 중앙 복귀 */}
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
          x: bodyX,
          rotate: bodyRot,
        }}
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

      {/* 다 갈리면 — 방금 간 종이가 색종이로! 파쇄기 투입구에서 위로 4번 뿜어져 나온다(팡팡팡) */}
      {done &&
        WAVES.map((wave, wi) => {
          return (
            <div key={`wave${wi}`}>
              {/* 투입구에서 위로 솟는 분출 제트(나오는 느낌) */}
              <motion.div
                style={{ position: 'absolute', left: '50%', bottom: SLOT_BOTTOM, width: 26, height: 70, marginLeft: wave.ox - 13, borderRadius: 13, background: 'linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,248,220,0.85) 40%, rgba(255,255,255,0) 100%)', filter: 'blur(2px)', transformOrigin: '50% 100%', zIndex: 3, pointerEvents: 'none' }}
                initial={{ scaleY: 0.2, scaleX: 1, opacity: 0 }}
                animate={{ scaleY: [0.2, 1.3, 0.6], scaleX: [1, 0.7, 1.4], opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.42, delay: wave.delay, ease: 'easeOut' }}
              />
              {/* 투입구에서 터지는 섬광 */}
              <motion.div
                style={{ position: 'absolute', left: '50%', bottom: SLOT_BOTTOM, width: 90, height: 90, marginLeft: wave.ox - 45, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,236,170,0.6) 32%, rgba(255,236,170,0) 68%)', zIndex: 4, pointerEvents: 'none' }}
                initial={{ scale: 0.15, opacity: 0 }}
                animate={{ scale: [0.15, 1.5, 1.9], opacity: [0, 0.95, 0] }}
                transition={{ duration: 0.5, delay: wave.delay + 0.04, ease: 'easeOut' }}
              />
              {/* 색종이 — 투입구에서 '위로' 솟구쳤다가 사방으로 퍼지며 낙하 */}
              {Array.from({ length: wave.n }).map((_, i) => {
                const seed = wi * 50 + i
                const ang = (i / wave.n) * Math.PI * 2 + (rnd(seed) - 0.5) * 0.5
                const speed = wave.sp * (0.6 + rnd(seed + 5) * 0.6) // 강하게, 다양하게
                const ex = Math.cos(ang) * speed
                const ey = Math.sin(ang) * speed - wave.up // 음수=위 / -up: 투입구에서 위로 솟는 분출 바이어스
                const grav = 130 + rnd(seed + 9) * 160 // 솟았다가 아래로 떨어짐
                const dur = 1.2 + rnd(seed + 7) * 0.7
                const dly = wave.delay + rnd(seed + 3) * 0.05
                const w = 4 + Math.round(rnd(seed + 11) * 4) // 색종이 폭 4~8px
                const len = 5 + Math.round(rnd(seed + 13) * 7)
                const spin = (rnd(seed + 15) < 0.5 ? -1 : 1) * (300 + rnd(seed + 17) * 380)
                const color = CONFETTI[(i + wi * 3) % CONFETTI.length]
                return (
                  <motion.span
                    key={`c${wi}_${i}`}
                    style={{ position: 'absolute', left: '50%', bottom: SLOT_BOTTOM, width: w, height: len, marginLeft: wave.ox - w / 2, borderRadius: 1, background: color, boxShadow: '0 1px 2px rgba(0,0,0,0.2)', zIndex: 3, pointerEvents: 'none' }}
                    initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
                    animate={{
                      x: [0, ex * 0.4, ex, ex],
                      y: [0, ey * 0.9, ey, ey + grav],
                      opacity: [0, 1, 1, 0],
                      rotate: [0, spin * 0.4, spin * 0.8, spin],
                      scale: [0.4, 1.15, 1, 0.8],
                    }}
                    transition={{ duration: dur, delay: dly, times: [0, 0.22, 0.5, 1], ease: 'easeOut' }}
                  />
                )
              })}
            </div>
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
