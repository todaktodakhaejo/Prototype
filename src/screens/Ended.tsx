import { motion } from 'framer-motion'
import { useStore } from '../store'
import { ENDED_MESSAGE, ENDED_RESTART_LABEL } from '../constants'

// 기분 post 응답 후 종료 화면. 다음 라운드는 자동으로 시작하지 않는다
// (같은 기분 질문이 곧바로 또 뜨는 중복 방지). 다시 시작은 명시적 선택으로만.
export default function Ended() {
  const startNewRound = useStore((s) => s.startNewRound)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, color: 'var(--on-bg)', textAlign: 'center' }}
    >
      <h1 className="serif" style={{ fontSize: 28 }}>
        {ENDED_MESSAGE}
      </h1>
      <button
        className="btn"
        style={{ background: 'rgba(255,255,255,0.18)', color: 'var(--on-bg)', fontSize: 14 }}
        onClick={startNewRound}
      >
        {ENDED_RESTART_LABEL}
      </button>
    </motion.div>
  )
}
