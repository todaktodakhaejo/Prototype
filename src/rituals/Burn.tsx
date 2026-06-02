import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import Gauge from './Gauge'
import { rotatingMessage, BURN_MESSAGES } from '../constants'
import { hapticBurnTick, stopVibration } from '../haptics'

// 타오르는 진동 간격: 아래(느림)→위(잦음). 진행도 0→1에서 이 사이로 좁혀진다.
const BURN_GAP_SLOW_MS = 300 // 막 붙었을 때(아래) — 드문드문
const BURN_GAP_FAST_MS = 70 // 다 타갈 때(위) — 다다닥

const HOLD_SEC = 3.2 // 불붙은 뒤 다 타는 데 걸리는 시간
const HOLD_MSG = 2.6 // 잿더미 + 멘트 머무는 여운
const IGNITE_DIST = 52 // 성냥을 이만큼 끌면 점화
const FLAMES = [
  { dx: -30, w: 20, h: 34, flick: 0.46 },
  { dx: -10, w: 26, h: 46, flick: 0.52 },
  { dx: 12, w: 24, h: 40, flick: 0.44 },
  { dx: 30, w: 18, h: 30, flick: 0.5 },
]

// 태우기 — 먼저 '성냥을 끌어' 종이에 불을 붙이면(점화), 그때부터 아래에서 위로 타오른다.
//  점화 후엔 진행도(progress)가 시간에 따라 0→1로 차오르고, 게이지가 그와 동시에 찬다.
export default function Burn({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('burn', BURN_MESSAGES))
  const [lit, setLit] = useState(false) // 불 붙음
  const [progress, setProgress] = useState(0) // 0~1 (아래에서부터 탄 정도)
  const [done, setDone] = useState(false)
  const last = useRef(0)
  const fired = useRef(false)
  const litRef = useRef(false)
  const progressRef = useRef(0) // 햅틱 인터벌에서 최신 진행도 읽기용
  progressRef.current = progress

  const ignite = () => {
    if (!litRef.current) {
      litRef.current = true
      setLit(true)
    }
  }
  const onMatchDrag = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (Math.hypot(info.offset.x, info.offset.y) > IGNITE_DIST) ignite()
  }

  // 불이 붙으면 자동으로 타오름
  useEffect(() => {
    if (!lit || done) return
    let id = 0
    const tick = (t: number) => {
      if (!last.current) last.current = t
      const dt = (t - last.current) / 1000
      last.current = t
      setProgress((p) => Math.min(1, p + dt / HOLD_SEC))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(id)
      last.current = 0
    }
  }, [lit, done])

  // 타오르는 동안: 위로 갈수록 진동 '빈도'가 잦아짐(간격이 짧아짐). 세기는 일정.
  //   self-scheduling 타이머 — 매 펄스 직후 현재 진행도로 다음 간격을 다시 계산.
  useEffect(() => {
    if (!lit || done) return
    let id = 0
    let alive = true
    const loop = () => {
      if (!alive) return
      const p = Math.max(0, Math.min(1, progressRef.current))
      hapticBurnTick()
      const gap = Math.round(BURN_GAP_SLOW_MS - p * (BURN_GAP_SLOW_MS - BURN_GAP_FAST_MS))
      id = window.setTimeout(loop, gap)
    }
    loop()
    return () => {
      alive = false
      window.clearTimeout(id)
      stopVibration()
    }
  }, [lit, done])

  // 다 타면 마무리 (fired 가드 + done을 deps에서 제외 → 타이머가 cleanup에 취소되지 않음)
  useEffect(() => {
    if (progress >= 1 && !fired.current) {
      fired.current = true
      setDone(true)
      const t = setTimeout(onDone, HOLD_MSG * 1000)
      return () => clearTimeout(t)
    }
  }, [progress, onDone])

  const pct = progress * 100
  const flameOn = lit && !done

  return (
    <div style={{ position: 'relative', width: 220, height: 300, touchAction: 'none' }}>
      {/* 광원 — 불 붙으면 밝아짐 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '42%',
          width: 240,
          height: 240,
          marginLeft: -120,
          marginTop: -120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,176,80,0.45) 0%, rgba(255,150,60,0) 64%)',
          opacity: flameOn ? 0.9 : 0.12,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      />

      {/* 연기 — 타는 동안 */}
      {flameOn &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: 80,
              width: 56,
              height: 56,
              marginLeft: -28 + (i - 1) * 22,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(190,190,195,0.32) 0%, rgba(190,190,195,0) 70%)',
              filter: 'blur(5px)',
              pointerEvents: 'none',
            }}
            initial={{ y: 30, opacity: 0, scale: 0.6 }}
            animate={{ y: [-30, -140], opacity: [0, 0.45, 0], scale: [0.6, 1.3, 1.7] }}
            transition={{ duration: 2.4, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}

      {/* 종이(글) — 아래에서부터 탄 만큼 깎임(진행도로 clip) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '24px 20px',
          borderRadius: 6,
          background: 'var(--paper, #fbf7f4)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
          fontFamily: 'var(--batang)',
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--ink)',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          clipPath: `inset(0% 0 ${pct}% 0)`,
          opacity: done ? 0 : 1,
          transition: 'opacity 0.5s',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>

      {/* 타는 경계(front) — 진행도 위치에 그을림 + 잉걸 + 불꽃 */}
      {!done && progress > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct}%`, height: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -2,
              height: 52,
              background:
                'linear-gradient(0deg, #2a1408 0%, rgba(58,30,16,0.75) 26%, rgba(96,54,28,0.3) 58%, rgba(96,54,28,0) 100%)',
              filter: 'blur(1px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -4,
              right: -4,
              bottom: -2,
              height: 6,
              borderRadius: 4,
              background: 'linear-gradient(0deg, #ff7a2f 0%, #ffd770 100%)',
              filter: 'blur(1.2px)',
              boxShadow: '0 0 16px 5px rgba(255,160,70,0.7)',
              opacity: flameOn ? 1 : 0.5,
            }}
          />
          {FLAMES.map((f, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: -2,
                width: f.w,
                height: f.h,
                marginLeft: f.dx - f.w / 2,
                transformOrigin: 'bottom center',
                borderRadius: '50% 50% 48% 48% / 72% 72% 40% 40%',
                background:
                  'radial-gradient(52% 60% at 50% 74%, #fff0b8 0%, #ffd270 38%, #ffa64d 68%, rgba(255,166,77,0) 100%)',
                filter: 'blur(1.2px)',
                opacity: flameOn ? 0.92 : 0,
                transition: 'opacity 0.2s',
              }}
              animate={{ scaleY: [0.82, 1.14, 0.92, 1.08, 0.82], scaleX: [1, 0.88, 1.05, 0.92, 1], x: [0, -2, 2, -1, 0] }}
              transition={{ duration: f.flick, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* 잿더미 — 다 탄 뒤 */}
      {done && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 64,
            width: 128,
            height: 28,
            marginLeft: -64,
            borderRadius: '50% 50% 42% 42% / 82% 82% 26% 26%',
            background: 'radial-gradient(ellipse at 50% 26%, #f6f3f2 0%, #ddd7d4 52%, #bdb6b2 100%)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.16)',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0, scaleY: 0.35, y: 10 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}

      {/* 성냥 — 끌어서 종이에 불을 붙임 (점화 전에만) */}
      {!lit && !done && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.4}
          onDrag={onMatchDrag}
          whileDrag={{ cursor: 'grabbing' }}
          style={{
            position: 'absolute',
            left: -40, // 종이 왼쪽 바깥 아래 — 여기서부터 끌어 종이에 불을 붙임
            bottom: 2,
            width: 14,
            height: 92,
            zIndex: 20,
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          {/* 성냥대 */}
          <div
            style={{
              position: 'absolute',
              left: 5,
              top: 16,
              width: 4,
              height: 74,
              borderRadius: 2,
              background: 'linear-gradient(180deg, #d8b483 0%, #9a6a3a 100%)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            }}
          />
          {/* 성냥 머리 + 작은 불씨 */}
          <div
            style={{
              position: 'absolute',
              left: 1,
              top: 0,
              width: 12,
              height: 18,
              borderRadius: '50% 50% 46% 46%',
              background: 'radial-gradient(circle at 42% 34%, #ffd07a 0%, #ff7a3a 42%, #b3301a 100%)',
              boxShadow: '0 0 10px 2px rgba(255,150,70,0.7)',
            }}
          />
        </motion.div>
      )}

      {/* 진행 게이지 — 불 붙은 뒤, 누른 정도(progress)와 '동시에' 차오름 */}
      {lit && !done && <Gauge value={progress} from="#ff7a2f" to="#ffd770" />}

      {/* 상단 행위 안내 캡션 */}
      {!done && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {lit ? '활활 타오르고 있어요' : '🔥 성냥을 끌어 종이에 불을 붙이세요'}
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {done && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, pointerEvents: 'none' }}
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
