import { motion } from 'framer-motion'
import { useStore } from '../store'
import { RITUAL_PROMPT_TITLE, RITUAL_PROMPT_YES, RITUAL_PROMPT_NO } from '../constants'

// 공놀이 후 분기 팝업 — 종이가 등장하기 전:
//   리츄얼까지 해볼래요 → 글쓰기·의식 진행
//   오늘은 여기까지 할래요 → 바로 기분 척도(종료)
export default function RitualPrompt() {
  const chooseRitual = useStore((s) => s.chooseRitual)
  const chooseEndNow = useStore((s) => s.chooseEndNow)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, width: '100%', maxWidth: 360 }}
    >
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 21, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {RITUAL_PROMPT_TITLE}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
        <button className="btn" style={{ width: '100%' }} onClick={chooseRitual}>
          {RITUAL_PROMPT_YES}
        </button>
        <button
          className="btn"
          style={{ width: '100%', background: 'rgba(255,255,255,0.18)', color: 'var(--on-bg)' }}
          onClick={chooseEndNow}
        >
          {RITUAL_PROMPT_NO}
        </button>
      </div>
    </motion.div>
  )
}
