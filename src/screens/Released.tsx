import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { RELEASE_PAUSE_MS, RELEASED_TITLE, RELEASED_TITLE_BALL, RELEASED_SUBTITLE } from '../constants'

// 빈 화면 여운(RELEASE_PAUSE_MS) → 완료 멘트 → (KPI: 기분 post / 아니면 홈 리셋 +1)
// 공놀이만 한 경로(ball_only)는 '환기'가 아니므로 다른 멘트를 보여준다.
export default function Released() {
  const afterReleased = useStore((s) => s.afterReleased)
  const postRoundType = useStore((s) => s.postRoundType)
  const [showMsg, setShowMsg] = useState(false)
  const title = postRoundType === 'ball_only' ? RELEASED_TITLE_BALL : RELEASED_TITLE

  useEffect(() => {
    const t1 = setTimeout(() => setShowMsg(true), RELEASE_PAUSE_MS)
    const t2 = setTimeout(afterReleased, RELEASE_PAUSE_MS + 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [afterReleased])

  return (
    <AnimatePresence>
      {showMsg && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          style={{ color: 'var(--on-bg)', textAlign: 'center' }}
        >
          <h1 className="serif" style={{ fontSize: 30, marginBottom: 10 }}>
            {title}
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>{RELEASED_SUBTITLE}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
