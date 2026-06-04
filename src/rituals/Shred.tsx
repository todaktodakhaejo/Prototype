import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
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
const GRIND_DIST = 5400 // 이만큼(px) 문질러야 다 갈림 (게이지 더 천천히 — 더 많이 흔들어야 완전 파쇄)

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

  // 파쇄기 유닛을 직접 끌면 그 방향으로 따라 흔들리고(달달달) 놓으면 중앙 복귀(Framer drag).
  //  끄는 거리만큼 종이가 갈려 들어가고(progress), 거리 누적마다 갈리는 진동.
  const onGrindDrag = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (done) return
    const d = Math.abs(info.delta.x) + Math.abs(info.delta.y)
    if (d <= 0) return
    setProgress((v) => Math.min(1, v + d / GRIND_DIST))
    grindAcc.current += d
    if (grindAcc.current >= GRIND_HAPTIC_PX) {
      grindAcc.current = 0
      hapticShredTick()
    }
  }

  const fed = progress * 138 // 종이가 슬롯으로 들어간 정도(px) — progress=1에서 정확히 다 들어가도록(게이지와 싱크)

  return (
    <div style={{ position: 'relative', width: 240, height: 280, marginTop: 34 }}>
      {/* 파쇄기 유닛 — 본체·슬롯·종이가 '한 덩어리'. 직접 끌면 그 방향으로 달달달 흔들리고 놓으면 중앙 복귀. */}
      <motion.div
        drag={!done}
        dragSnapToOrigin
        dragConstraints={{ left: -64, right: 64, top: -32, bottom: 32 }}
        dragElastic={0.5}
        dragMomentum={false}
        onDragStart={() => setGrinding(true)}
        onDrag={onGrindDrag}
        onDragEnd={() => setGrinding(false)}
        whileDrag={{ cursor: 'grabbing' }}
        style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: done ? 'default' : 'grab' }}
      >
        {/* 종이(글) — 기계 위에 얹혀 투입구(슬롯)로 빨려 들어감. 슬롯 입구(높이 132)에서 클립. */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 132, overflow: 'hidden', zIndex: 3, pointerEvents: 'none' }}>
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
              transformOrigin: '50% 0%',
              transform: `translateY(${fed}px) scaleX(${1 - progress * 0.1})`,
            }}
          >
            {text}
          </div>
        </div>

        {/* 본체 */}
        <div
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
        >
          {/* 투입구(슬롯) */}
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
        </div>
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
