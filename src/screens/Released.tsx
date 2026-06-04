import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { RELEASE_PAUSE_MS, RELEASED_TITLE, RELEASED_TITLE_BALL, RELEASED_SUBTITLE } from '../constants'

// 빈 화면 여운(RELEASE_PAUSE_MS) → 완료 멘트 → (KPI: 기분 post / 아니면 홈 리셋 +1)
// 공놀이만 한 경로(ball_only)는 '환기'가 아니므로 다른 멘트를 보여준다.
export default function Released() {
  const afterReleased = useStore((s) => s.afterReleased)
  const [showMsg, setShowMsg] = useState(false)
  // 완료 멘트는 '진입 시점' 경로로 고정한다. afterReleased가 다음 라운드로 넘어가며
  // postRoundType을 null로 리셋하는데, 이 화면이 크로스페이드로 빠져나가는 동안 아직 마운트돼 있어
  // 구독값이 바뀌면 멘트가 기본값('환기가 끝났어요')으로 잠깐 바뀌는 잔상이 생긴다. → mount 시 1회 고정.
  const [title] = useState(() => (useStore.getState().postRoundType === 'ball_only' ? RELEASED_TITLE_BALL : RELEASED_TITLE))

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
