import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { formatToday } from '../hooks/useTimeOfDay'
import { COMFORT_MESSAGES, rotatingMessage } from '../constants'
import JellyBall from '../components/JellyBall'
import { addBallActive } from '../analytics'

// HOME:
//  1차 터치 → 위로 멘트·날짜 fade-out (공만 남음)
//  지그시 누르기(롱프레스) → 다음으로 (KPI 모드: 분기 팝업 / 아니면 글쓰기)
export default function Home() {
  const proceedFromHome = useStore((s) => s.proceedFromHome)
  const [cleared, setCleared] = useState(false)
  // 홈에 들어올 때마다 8개 멘트를 순서대로 번갈아 노출 (마운트 시 1회 선택)
  const [message] = useState(() => rotatingMessage('home', COMFORT_MESSAGES))

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

      {/* 중앙: 위로 멘트 + 공.
          멘트 자리를 고정 높이로 '예약'해 둠 → 멘트가 사라져도(opacity만 변함) 공이 위로 튀지 않음. */}
      <div style={{ height: 92, marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <motion.p
          className="serif"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: cleared ? 0 : 0.9, y: cleared ? -6 : 0 }}
          transition={{ duration: cleared ? 0.6 : 1 }}
          style={{
            color: 'var(--on-bg)',
            fontSize: 18,
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
            maxWidth: 300,
            textAlign: 'center',
          }}
        >
          {message}
        </motion.p>
      </div>

      <JellyBall
        onPressStart={() => setCleared(true)}
        onLongPress={proceedFromHome}
        onPlayActive={(ms) => addBallActive(ms)}
      />

      {/* 하단 힌트 — 첫 터치 전: 만져보기 안내 / 첫 터치 후: 다음으로 안내 */}
      <AnimatePresence mode="wait">
        <motion.p
          key={cleared ? 'press' : 'touch'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: 'absolute', bottom: 120, color: 'var(--on-bg)', fontSize: 13 }}
        >
          {cleared ? '공을 지그시 누르면 다음으로 넘어가요' : '감정말랑이를 마음껏 만져보세요'}
        </motion.p>
      </AnimatePresence>
    </>
  )
}
