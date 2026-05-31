import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import JellyBall from '../components/JellyBall'

// 말랑이(오브제)를 소개하는 온보딩 멘트 — 자동으로 돌아가며 뜬다
const MESSAGES = [
  '오늘도 이것저것 많이 담고 오셨네요.\n일단 저한테 좀 넘겨보실래요?',
  '걱정은 머리에서 나오지만,\n의외로 손에서 풀리기도 해요.',
  '오늘 하루, 얼마나 단단했나요?\n일단 저부터 말랑해질게요.',
  '꾹 눌러보세요.\n제가 대신 버텨볼게요.',
  '앗, 오셨어요!\n오늘의 꾹꾹이를 기다리고 있었어요.',
  '걱정은 잠시 여기 두고 가세요.\n제가 깔고 앉아 있을게요.',
  '손이 심심해 보이네요.\n저를 한 번 눌러보실래요?',
  '마음이 복잡한 날에도,\n말랑이는 원래 말랑해요.',
]

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
