import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, BURN_MESSAGES } from '../constants'

const HOLD_SEC = 1.8 // 꾹 누르고 있어야 다 타는 시간
const HOLD_MSG = 1.7 // 잿더미 + 멘트 머무는 시간
const FLAMES = [
  { dx: -30, w: 20, h: 34, flick: 0.46 },
  { dx: -10, w: 26, h: 46, flick: 0.52 },
  { dx: 12, w: 24, h: 40, flick: 0.44 },
  { dx: 30, w: 18, h: 30, flick: 0.5 },
]

// 태우기 — 사용자가 종이를 '꾹 누르고 있는 동안' 아래에서부터 타들어간다(직접 행위).
//  누르면 타오르고, 떼면 멈춘다. 다 타면 흰 잿더미 + 멘트.
export default function Burn({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('burn', BURN_MESSAGES))
  const [progress, setProgress] = useState(0) // 0~1 (아래에서부터 탄 정도)
  const [pressing, setPressing] = useState(false)
  const [done, setDone] = useState(false)
  const last = useRef(0)
  const fired = useRef(false)

  // 누르고 있는 동안만 진행
  useEffect(() => {
    if (!pressing || done) return
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
  }, [pressing, done])

  // 다 타면 마무리 (fired 가드 + done을 deps에서 제외 → 타이머가 cleanup에 취소되지 않음)
  useEffect(() => {
    if (progress >= 1 && !fired.current) {
      fired.current = true
      setDone(true)
      setPressing(false)
      const t = setTimeout(onDone, HOLD_MSG * 1000)
      return () => clearTimeout(t)
    }
  }, [progress, onDone])

  const pct = progress * 100
  const flameOn = pressing && !done

  return (
    <div
      style={{ position: 'relative', width: 220, height: 300, touchAction: 'none', cursor: 'pointer' }}
      onPointerDown={() => !done && setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      onPointerCancel={() => setPressing(false)}
    >
      {/* 광원 — 누를 때 밝아짐 */}
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
          opacity: flameOn ? 0.9 : 0.2 + progress * 0.3,
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

      {/* 상단 행위 안내 캡션 (어두운 알약 — 흰 종이 위에서도 잘 보이게) */}
      {!done && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {progress > 0 ? '계속 꾹 누르고 계세요' : '🔥 꾹 눌러서 태워보세요'}
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
