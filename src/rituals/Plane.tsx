import { motion } from 'framer-motion'
import type { RitualProps } from './index'

const DURATION = 2.6

// 비행기 접어 날리기:
//  STEP1 종이(글) → STEP2 반으로 접히며 비행기로 변함(텍스트 fade, 비행기 등장)
//  STEP3 비행기가 사선으로 하늘로 날아가 사라짐(감정이 떠나가는 느낌)
export default function Plane({ text, onDone }: RitualProps) {
  return (
    <motion.div
      style={{ position: 'relative', width: 200, height: 260 }}
      initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
      animate={{
        x: [0, 0, 340],
        y: [0, 0, -300],
        rotate: [0, -4, -24],
        scale: [1, 0.95, 0.32],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: DURATION, times: [0, 0.5, 1], ease: 'easeIn' }}
      onAnimationComplete={onDone}
    >
      {/* 종이(글) — 접히듯 좁아지며 사라짐 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '24px 20px',
          borderRadius: 6,
          background: 'var(--paper)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
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
        animate={{ scaleX: [1, 0.2, 0.2], opacity: [1, 0, 0] }}
        transition={{ duration: DURATION, times: [0, 0.45, 1], ease: 'easeIn' }}
      >
        {text}
      </motion.div>

      {/* 종이비행기 — 접히는 시점에 등장 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: DURATION, times: [0, 0.42, 0.6], ease: 'easeOut' }}
      >
        <svg width={120} height={90} viewBox="0 0 120 90" aria-hidden>
          {/* 아래 날개(밝은 면) */}
          <polygon points="10,82 112,8 60,56" fill="#fbf7f4" />
          {/* 몸체/접힘선(어두운 면) */}
          <polygon points="112,8 60,56 80,82" fill="#e3dad2" />
        </svg>
      </motion.div>
    </motion.div>
  )
}
