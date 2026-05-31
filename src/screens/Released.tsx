import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { RELEASE_PAUSE_MS } from '../constants'

// 빈 화면 여운(RELEASE_PAUSE_MS) → "다 보냈어요" → 홈 리셋(+1)
export default function Released() {
  const resetHome = useStore((s) => s.resetHome)
  const [showMsg, setShowMsg] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowMsg(true), RELEASE_PAUSE_MS)
    const t2 = setTimeout(resetHome, RELEASE_PAUSE_MS + 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [resetHome])

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
            다 보냈어요
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>처음으로 돌아가요</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
