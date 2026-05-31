import { motion } from 'framer-motion'
import { useStore } from '../store'
import { RITUALS } from '../constants'

export default function RitualPick() {
  const pickRitual = useStore((s) => s.pickRitual)

  return (
    <>
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 20, marginBottom: 36 }}>
        어떻게 보낼까요
      </p>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        {RITUALS.map((r, idx) => (
          <motion.button
            key={r.id}
            onClick={() => pickRitual(r.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              width: 96,
              height: 120,
              border: 'none',
              borderRadius: 18,
              cursor: 'pointer',
              background: '#ffffff',
              boxShadow: '0 6px 18px rgba(180,150,60,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 34 }}>{r.emoji}</span>
            <span style={{ fontFamily: 'var(--batang)', fontSize: 14, color: 'var(--ink)' }}>{r.label}</span>
          </motion.button>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 28, color: 'var(--on-bg)', opacity: 0.55 }}>
        고르면 바로 흘려보내요
      </p>
    </>
  )
}
