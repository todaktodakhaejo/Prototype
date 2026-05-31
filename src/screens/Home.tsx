import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { formatToday } from '../hooks/useTimeOfDay'
import { COMFORT_MESSAGES } from '../constants'
import JellyBall from '../components/JellyBall'
import { addBallActive } from '../analytics'

// HOME:
//  1차 터치 → 위로 멘트·날짜 fade-out (공만 남음)
//  지그시 누르기(롱프레스) → 다음으로 (KPI 모드: 분기 팝업 / 아니면 글쓰기)
export default function Home() {
  const proceedFromHome = useStore((s) => s.proceedFromHome)
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
            style={{
              color: 'var(--on-bg)',
              fontSize: 18,
              lineHeight: 1.8,
              marginBottom: 48,
              whiteSpace: 'pre-line',
              maxWidth: 300,
              textAlign: 'center',
            }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <JellyBall
        onPressStart={() => setCleared(true)}
        onLongPress={proceedFromHome}
        onPlayActive={(ms) => addBallActive(ms)}
      />

      <AnimatePresence>
        {cleared && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            style={{ position: 'absolute', bottom: 120, color: 'var(--on-bg)', fontSize: 13 }}
          >
            공을 지그시 누르면, 다음으로 넘어가요
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
