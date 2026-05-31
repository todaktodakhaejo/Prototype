import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { formatToday } from '../hooks/useTimeOfDay'
import { COMFORT_MESSAGES } from '../constants'
import JellyBall from '../components/JellyBall'

// HOME 2단계 탭:
//  1차 터치 → 위로 멘트·날짜 fade-out (공만 남음)
//  2차 터치 → WRITE 진입
export default function Home() {
  const enterWrite = useStore((s) => s.enterWrite)
  const releaseCount = useStore((s) => s.releaseCount)
  const [cleared, setCleared] = useState(false)
  // 멘트는 진입 시 1개 고정 (releaseCount로 순환 — 매번 같지 않게)
  const message = COMFORT_MESSAGES[releaseCount % COMFORT_MESSAGES.length]

  return (
    <>
      {/* 상단: 날짜 */}
      <AnimatePresence>
        {!cleared && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'absolute', top: 64, color: 'var(--on-bg)', fontSize: 14, letterSpacing: '0.1em' }}
          >
            {formatToday()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 중앙: 위로 멘트 + 공 */}
      <AnimatePresence>
        {!cleared && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.9, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 1 }}
            className="serif"
            style={{ color: 'var(--on-bg)', fontSize: 22, marginBottom: 48 }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <JellyBall onPressStart={() => setCleared(true)} onLongPress={enterWrite} />

      <AnimatePresence>
        {cleared && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            style={{ position: 'absolute', bottom: 120, color: 'var(--on-bg)', fontSize: 13 }}
          >
            공을 지그시 누르면, 마음을 적어요
          </motion.p>
        )}
      </AnimatePresence>

      {/* 하단: 해소 카운터 */}
      <div style={{ position: 'absolute', bottom: 40, color: 'var(--on-bg)', opacity: 0.5, fontSize: 12 }}>
        흘려보낸 마음 {releaseCount}
      </div>
    </>
  )
}
