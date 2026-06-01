import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, PLANE_MESSAGES } from '../constants'

const D = 3.4
const HOLD = 1.1
const MOTES = 6

// 날리기 — 종이가 비행기로 접힌 뒤, 빛 꼬리를 끌며 완만한 곡선으로 하늘로 멀어진다.
//  감정이 천천히, 아쉬움 없이 떠나가는 느낌. 사라지는 자리에 반짝임 + 주변엔 떠다니는 빛 입자.
export default function Plane({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('plane', PLANE_MESSAGES))
  useEffect(() => {
    const t = setTimeout(onDone, (D + HOLD) * 1000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{ position: 'relative', width: 240, height: 320 }}>
      {/* 떠다니는 빛 입자 — 몽환적인 하늘 분위기 (전체 동안 은은히) */}
      {Array.from({ length: MOTES }).map((_, i) => {
        const left = 18 + ((i * 47) % 200)
        const top = 40 + ((i * 83) % 220)
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 0 8px 2px rgba(255,228,160,0.7)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.8, 0], y: [0, -26, -52] }}
            transition={{ duration: 3, delay: (i % 3) * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      })}

      {/* 종이(글) — 부드럽게 반으로 접히며 사라짐 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '24px 20px',
          borderRadius: 6,
          background: 'var(--paper, #fbf7f4)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
          fontFamily: 'var(--batang)',
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--ink)',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
          transformOrigin: 'center',
        }}
        initial={{ scaleX: 1, opacity: 1 }}
        animate={{ scaleX: [1, 0.5, 0.18], opacity: [1, 0.5, 0] }}
        transition={{ duration: D, times: [0, 0.28, 0.4], ease: 'easeInOut' }}
      >
        {text}
      </motion.div>

      {/* 비행기 — 빛 꼬리를 달고 완만한 곡선으로 하늘로 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        // 종이가 다 접힐 때(t≈0.4)까지 숨어 있다가, 그 자리에서 비행기로 나타나 날아간다 (겹침 방지)
        initial={{ x: 0, y: 0, rotate: 0, scale: 0.92, opacity: 0 }}
        animate={{
          x: [0, 0, 0, 150, 300],
          y: [0, 0, 0, -150, -286],
          rotate: [0, 0, 0, -16, -24],
          scale: [0.92, 0.92, 0.98, 0.5, 0.22],
          opacity: [0, 0, 1, 1, 0],
        }}
        transition={{ duration: D, times: [0, 0.4, 0.46, 0.8, 1], ease: 'easeInOut' }}
      >
        <div style={{ position: 'relative' }}>
          {/* 부드러운 후광 */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 120,
              height: 120,
              transform: 'translate(-50%,-50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,236,180,0.55) 0%, rgba(255,236,180,0) 70%)',
            }}
          />
          {/* 빛 꼬리(혜성 트레일) — 비행 반대쪽(좌하)으로 길게 */}
          <div
            style={{
              position: 'absolute',
              right: 6,
              top: 52,
              width: 150,
              height: 10,
              transformOrigin: 'right center',
              transform: 'rotate(24deg)',
              borderRadius: 5,
              background: 'linear-gradient(270deg, rgba(255,250,235,0.85) 0%, rgba(255,236,180,0.4) 35%, rgba(255,236,180,0) 100%)',
              filter: 'blur(2px)',
            }}
          />
          {/* 종이비행기 */}
          <svg width={120} height={90} viewBox="0 0 120 90" aria-hidden style={{ position: 'relative' }}>
            <polygon points="10,82 112,8 60,56" fill="#ffffff" />
            <polygon points="112,8 60,56 80,82" fill="#efe7dd" />
          </svg>
        </div>
      </motion.div>

      {/* 사라지는 자리의 반짝임 */}
      <motion.div
        style={{
          position: 'absolute',
          right: -30,
          top: 0,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, rgba(255,236,180,0) 70%)',
          boxShadow: '0 0 16px 5px rgba(255,236,180,0.9)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0, 1, 0], scale: [0.4, 0.4, 1.3, 0.6] }}
        transition={{ duration: D, times: [0, 0.82, 0.92, 1], ease: 'easeOut' }}
      />

      {/* 마무리 멘트 — 비행기가 멀어지며 */}
      <motion.p
        className="serif"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 16,
          textAlign: 'center',
          color: 'var(--on-bg)',
          fontSize: 16,
          whiteSpace: 'pre-line',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1], y: [6, 0] }}
        transition={{ duration: 0.7, delay: D * 0.62, ease: 'easeOut' }}
      >
        {msg}
      </motion.p>
    </div>
  )
}
