import { motion } from 'framer-motion'
import { MOOD_MAX, MOOD_LOW_LABEL, MOOD_HIGH_LABEL } from '../constants'

interface Props {
  title: string
  onSubmit: (value: number) => void
}

// 0~MOOD_MAX 한 탭 선택 척도 (KPI 모드 기분 pre/post 공용).
// 유도 없이 중립적으로 — 선택 즉시 제출.
export default function MoodScale({ title, onSubmit }: Props) {
  const values = Array.from({ length: MOOD_MAX + 1 }, (_, i) => i)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%' }}
    >
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 20, lineHeight: 1.5 }}>
        {title}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 360 }}>
        {values.map((v) => (
          <motion.button
            key={v}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSubmit(v)}
            aria-label={`${v}점`}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '1px solid rgba(120,100,40,0.28)',
              background: 'rgba(255,255,255,0.85)',
              color: 'var(--ink)',
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(180,150,60,0.16)',
            }}
          >
            {v}
          </motion.button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 360,
          color: 'var(--on-bg)',
          opacity: 0.6,
          fontSize: 12,
        }}
      >
        <span>0 · {MOOD_LOW_LABEL}</span>
        <span>
          {MOOD_MAX} · {MOOD_HIGH_LABEL}
        </span>
      </div>
    </motion.div>
  )
}
