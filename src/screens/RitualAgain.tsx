import { motion } from 'framer-motion'
import { useStore } from '../store'
import { RITUAL_AGAIN_TITLE, RITUAL_AGAIN_MORE, RITUAL_AGAIN_END } from '../constants'

// 환기 1회 후 분기 — 매 환기 직후 명시적으로 묻는다(허브로 바로 돌아가 이탈하는 것 방지).
//   '환기 더 하기' → 의식 허브 / '오늘은 여기까지' → 후속 기분 질문(MOOD_POST)
export default function RitualAgain() {
  const moreRitual = useStore((s) => s.moreRitual)
  const finishSession = useStore((s) => s.finishSession)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, width: '100%', maxWidth: 360 }}
    >
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 21, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {RITUAL_AGAIN_TITLE}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
        <button className="btn" style={{ width: '100%' }} onClick={moreRitual}>
          {RITUAL_AGAIN_MORE}
        </button>
        <button
          className="btn"
          style={{ width: '100%', background: 'rgba(255,255,255,0.18)', color: 'var(--on-bg)' }}
          onClick={finishSession}
        >
          {RITUAL_AGAIN_END}
        </button>
      </div>
    </motion.div>
  )
}
