import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, BURN_MESSAGES } from '../constants'

const D = 3.2 // 타들어가는 시간
const HOLD = 1.7 // 잿더미 + 멘트 머무는 시간

// 잔잔한 앰버 불꽃 갈래 — 작고 부드럽게(무섭지 않게).
const FLAMES = [
  { dx: -30, w: 20, h: 34, flick: 0.46 },
  { dx: -10, w: 26, h: 46, flick: 0.52 },
  { dx: 12, w: 24, h: 40, flick: 0.44 },
  { dx: 30, w: 18, h: 30, flick: 0.5 },
]
const EMBERS = 10
const SMOKE = 4

// 태우기 — 종이가 아래에서부터 실제로 타들어가 사라지고(clipPath), 끝에 흰 잿더미 한 줌 + 멘트.
export default function Burn({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('burn', BURN_MESSAGES))
  useEffect(() => {
    const t = setTimeout(onDone, (D + HOLD) * 1000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{ position: 'relative', width: 220, height: 300 }}>
      {/* 따뜻한 광원 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '40%',
          width: 240,
          height: 240,
          marginLeft: -120,
          marginTop: -120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,176,80,0.4) 0%, rgba(255,150,60,0) 64%)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.85, 0] }}
        transition={{ duration: D, times: [0, 0.3, 0.82, 1], ease: 'easeInOut' }}
      />

      {/* 연기 */}
      {Array.from({ length: SMOKE }).map((_, i) => {
        const x = -28 + i * 20
        return (
          <motion.span
            key={`s${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: 70,
              width: 60,
              height: 60,
              marginLeft: x - 30,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(190,190,195,0.34) 0%, rgba(190,190,195,0) 70%)',
              filter: 'blur(5px)',
              pointerEvents: 'none',
            }}
            initial={{ y: 40, opacity: 0, scale: 0.6 }}
            animate={{ y: [-40, -150], opacity: [0, 0.5, 0], scale: [0.6, 1.3, 1.7] }}
            transition={{ duration: 2.6, delay: 0.5 + (i % 4) * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        )
      })}

      {/* 종이(글) — 아래에서부터 clipPath로 깎여 사라짐 */}
      <motion.div
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
        }}
        initial={{ clipPath: 'inset(0% 0 0% 0)' }}
        animate={{ clipPath: ['inset(0% 0 0% 0)', 'inset(0% 0 100% 0)'] }}
        transition={{ duration: D, ease: 'easeIn' }}
      >
        {text}
      </motion.div>

      {/* 타는 경계(front) — 위로 올라가며 그을림 + 잉걸 + 불꽃, 끝에 사그라듦 */}
      <motion.div
        style={{ position: 'absolute', left: 0, right: 0, height: 0, pointerEvents: 'none' }}
        initial={{ bottom: '0%', opacity: 1 }}
        animate={{ bottom: ['0%', '82%', '100%'], opacity: [1, 1, 0] }}
        transition={{ duration: D, times: [0, 0.82, 1], ease: 'easeIn' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -2,
            height: 56,
            background:
              'linear-gradient(0deg, #2a1408 0%, rgba(58,30,16,0.78) 26%, rgba(96,54,28,0.32) 58%, rgba(96,54,28,0) 100%)',
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
            boxShadow: '0 0 16px 5px rgba(255,160,70,0.75)',
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
              opacity: 0.92,
            }}
            animate={{
              scaleY: [0.82, 1.14, 0.92, 1.08, 0.82],
              scaleX: [1, 0.88, 1.05, 0.92, 1],
              x: [0, -2, 2, -1, 0],
              opacity: [0.8, 0.96, 0.86, 0.96, 0.8],
            }}
            transition={{ duration: f.flick, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* 불티 */}
      {Array.from({ length: EMBERS }).map((_, i) => {
        const dx = ((i % 5) - 2) * 22 + (i % 2 ? 6 : -6)
        const rise = 140 + (i % 4) * 36
        return (
          <motion.span
            key={`e${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 40,
              width: 3.5,
              height: 3.5,
              marginLeft: -1.75,
              borderRadius: '50%',
              background: '#ffd770',
              boxShadow: '0 0 6px 2px rgba(255,160,70,0.75)',
              pointerEvents: 'none',
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: [0, dx * 0.5, dx], y: [0, -rise * 0.6, -rise], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, delay: 0.6 + (i % 6) * 0.2, ease: 'easeOut' }}
          />
        )
      })}

      {/* 잿더미 — 하얀 가루 한 줌 (다 타고 난 자리에 소복이) */}
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
          filter: 'blur(0.4px)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, scaleY: 0.35, y: 10 }}
        animate={{ opacity: [0, 1], scaleY: [0.35, 1], y: [10, 0] }}
        transition={{ duration: 0.8, delay: D, ease: 'easeOut' }}
      />

      {/* 마무리 멘트 */}
      <motion.p
        className="serif"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 18,
          textAlign: 'center',
          color: 'var(--on-bg)',
          fontSize: 16,
          whiteSpace: 'pre-line',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1], y: [6, 0] }}
        transition={{ duration: 0.7, delay: D + 0.35, ease: 'easeOut' }}
      >
        {msg}
      </motion.p>
    </div>
  )
}
