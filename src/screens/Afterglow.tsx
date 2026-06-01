import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { AFTERGLOW_MS } from '../constants'

// 공통 잔상 — 의식별 차별화 없이 통일 (MVP 결정)
export default function Afterglow() {
  const afterAfterglow = useStore((s) => s.afterAfterglow)

  useEffect(() => {
    const id = setTimeout(afterAfterglow, AFTERGLOW_MS)
    return () => clearTimeout(id)
  }, [afterAfterglow])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: [0, 0.8, 0.5], scale: [0.6, 1, 1.1] }}
      transition={{ duration: AFTERGLOW_MS / 1000, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, var(--jelly-pink) 70%)',
          boxShadow: '0 0 40px 12px rgba(244,184,199,0.6)',
        }}
      />
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 16, opacity: 0.8 }}>
        잔상이 남아요
      </p>
    </motion.div>
  )
}
