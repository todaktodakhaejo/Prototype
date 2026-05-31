import { motion } from 'framer-motion'
import type { RitualProps } from './index'

// 찢기: STEP1 온전 → STEP2 두 갈래 분리 → STEP3 조각 회전하며 흩날림
export default function Tear({ text, onDone }: RitualProps) {
  const half = {
    width: 110,
    minHeight: 280,
    padding: '24px 16px',
    background: 'var(--paper)',
    boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
    fontFamily: 'var(--batang)',
    fontSize: 14,
    lineHeight: 1.8,
    color: 'var(--ink)',
    overflow: 'hidden' as const,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  }
  const mid = Math.ceil(text.length / 2)

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      <motion.div
        style={{ ...half, textAlign: 'left', borderRadius: '6px 0 0 6px' }}
        initial={{ x: 0, rotate: 0, opacity: 1 }}
        animate={{ x: [0, -30, -200], rotate: [0, -10, -120], y: [0, 40, 260], opacity: [1, 1, 0] }}
        transition={{ duration: 2.4, ease: 'easeIn' }}
      >
        {text.slice(0, mid)}
      </motion.div>
      <motion.div
        style={{ ...half, textAlign: 'left', borderRadius: '0 6px 6px 0' }}
        initial={{ x: 0, rotate: 0, opacity: 1 }}
        animate={{ x: [0, 30, 200], rotate: [0, 10, 140], y: [0, 30, 280], opacity: [1, 1, 0] }}
        transition={{ duration: 2.4, ease: 'easeIn' }}
        onAnimationComplete={onDone}
      >
        {text.slice(mid)}
      </motion.div>
    </div>
  )
}
