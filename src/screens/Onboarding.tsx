import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import JellyBall from '../components/JellyBall'

const SLIDES = [
  { title: '흘림', body: '감정을 기록하지 않아요.\n흘려보내며 해소해요.' },
  { title: '적어요', body: '떠오르는 마음을 그대로,\n아무도 보지 않아요.' },
  { title: '보내요', body: '나만의 의식으로\n감정을 흘려보내요.' },
]

export default function Onboarding() {
  const [i, setI] = useState(0)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const last = i === SLIDES.length - 1

  return (
    <>
      <JellyBall faint size={120} />
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ marginTop: 40, color: 'var(--on-bg)' }}
      >
        <h1 className="serif" style={{ fontSize: 40, marginBottom: 16 }}>
          {SLIDES[i].title}
        </h1>
        <p style={{ whiteSpace: 'pre-line', lineHeight: 1.9, opacity: 0.85 }}>
          {SLIDES[i].body}
        </p>
      </motion.div>

      <div style={{ position: 'absolute', bottom: 56, display: 'flex', gap: 8 }}>
        {SLIDES.map((_, idx) => (
          <span
            key={idx}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: idx === i ? 'var(--on-bg)' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </div>

      <button
        className="btn"
        style={{ position: 'absolute', bottom: 96 }}
        onClick={() => (last ? completeOnboarding() : setI(i + 1))}
      >
        {last ? '시작하기' : '다음'}
      </button>
    </>
  )
}
