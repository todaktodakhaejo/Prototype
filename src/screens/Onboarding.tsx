import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { COMFORT_MESSAGES } from '../constants'
import JellyBall from '../components/JellyBall'

// 말랑이 멘트(COMFORT_MESSAGES)를 자동으로 돌아가며 띄운다 — 홈과 동일 소스
const MESSAGES = COMFORT_MESSAGES

const ROTATE_MS = 3800 // 멘트 전환 주기

export default function Onboarding() {
  const [i, setI] = useState(0)
  const completeOnboarding = useStore((s) => s.completeOnboarding)

  // 멘트 자동 순환
  useEffect(() => {
    const id = setInterval(() => {
      setI((prev) => (prev + 1) % MESSAGES.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <JellyBall faint size={120} />

      <div style={{ marginTop: 44, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            className="serif"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.92, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            style={{
              whiteSpace: 'pre-line',
              lineHeight: 1.9,
              fontSize: 19,
              color: 'var(--on-bg)',
              maxWidth: 300,
            }}
          >
            {MESSAGES[i]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 순환 위치 표시 */}
      <div style={{ position: 'absolute', bottom: 56, display: 'flex', gap: 7 }}>
        {MESSAGES.map((_, idx) => (
          <span
            key={idx}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: idx === i ? 'var(--on-bg)' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.4s ease',
            }}
          />
        ))}
      </div>

      <button className="btn" style={{ position: 'absolute', bottom: 92 }} onClick={completeOnboarding}>
        시작하기
      </button>
    </>
  )
}
