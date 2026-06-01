import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, PLANE_MESSAGES } from '../constants'

const FOLD_MS = 1200 // 종이가 접혀 사라지는 시간
const FLY = 2.6 // 비행기가 형태를 갖춰 날아가는 시간(초)
const MOTES = 6

// 날리기 — 'fold' 단계(종이 접힘)와 'fly' 단계(비행기 비행)를 state로 분리한다.
//  종이는 fly 단계가 되면 DOM에서 완전히 제거되므로, 비행 중 직사각형 종이가 남지 않는다.
export default function Plane({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('plane', PLANE_MESSAGES))
  const [phase, setPhase] = useState<'fold' | 'fly'>('fold')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fly'), FOLD_MS) // 접힘 끝 → 종이 언마운트, 비행기 등장
    const t2 = setTimeout(onDone, FOLD_MS + FLY * 1000 + 300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div style={{ position: 'relative', width: 240, height: 320 }}>
      {/* 떠다니는 빛 입자 */}
      {Array.from({ length: MOTES }).map((_, i) => {
        const left = 18 + ((i * 47) % 200)
        const top = 40 + ((i * 83) % 220)
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 0 8px 2px rgba(255,228,160,0.7)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.8, 0], y: [0, -26, -52] }}
            transition={{ duration: 3, delay: (i % 3) * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      })}

      {/* fold 단계: 종이(글)가 한 점으로 접혀 사라짐. fly 단계가 되면 이 노드는 사라짐(언마운트). */}
      {phase === 'fold' && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '24px 20px',
            borderRadius: 6,
            background: 'var(--paper, #fbf7f4)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
            fontFamily: 'var(--batang)',
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--ink)',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            transformOrigin: 'center',
          }}
          initial={{ scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 }}
          animate={{ scaleX: [1, 0.5, 0.12], scaleY: [1, 0.74, 0.4], rotate: [0, -5, -10], opacity: [1, 1, 0.2] }}
          transition={{ duration: FOLD_MS / 1000, times: [0, 0.55, 1], ease: 'easeInOut' }}
        >
          {text}
        </motion.div>
      )}

      {/* fly 단계: 종이가 사라진 자리에서 비행기 형태로 펼쳐져 날아감 (종이는 이미 언마운트됨) */}
      {phase === 'fly' && (
        <>
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
            initial={{ x: 0, y: 0, rotate: 0, scaleX: 0.45, scaleY: 0.26, opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scaleX: [0.45, 1, 0.6, 0.26], // 접힌 사리 → 가로로 펼쳐지며 비행기 형태
              scaleY: [0.26, 1, 0.6, 0.26],
              x: [0, 0, 150, 300],
              y: [0, 0, -150, -286],
              rotate: [0, -6, -16, -24],
            }}
            transition={{ duration: FLY, times: [0, 0.18, 0.7, 1], ease: 'easeInOut' }}
          >
            <div style={{ position: 'relative' }}>
              {/* 후광 */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 120,
                  height: 120,
                  transform: 'translate(-50%,-50%)',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,236,180,0.5) 0%, rgba(255,236,180,0) 70%)',
                }}
              />
              {/* 빛 꼬리 */}
              <div
                style={{
                  position: 'absolute',
                  right: 6,
                  top: 52,
                  width: 150,
                  height: 10,
                  transformOrigin: 'right center',
                  transform: 'rotate(24deg)',
                  borderRadius: 5,
                  background:
                    'linear-gradient(270deg, rgba(255,250,235,0.85) 0%, rgba(255,236,180,0.4) 35%, rgba(255,236,180,0) 100%)',
                  filter: 'blur(2px)',
                }}
              />
              {/* 종이비행기 */}
              <svg width={120} height={90} viewBox="0 0 120 90" aria-hidden style={{ position: 'relative' }}>
                <polygon points="10,82 112,8 60,56" fill="#ffffff" />
                <polygon points="112,8 60,56 80,82" fill="#efe7dd" />
              </svg>
            </div>
          </motion.div>

          {/* 사라지는 자리의 반짝임 */}
          <motion.div
            style={{
              position: 'absolute',
              right: -20,
              top: 10,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fff 0%, rgba(255,236,180,0) 70%)',
              boxShadow: '0 0 16px 5px rgba(255,236,180,0.9)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.3, 0.6] }}
            transition={{ duration: FLY, times: [0.55, 0.75, 1], ease: 'easeOut' }}
          />
        </>
      )}

      {/* 마무리 멘트 — 비행기가 멀어지며 */}
      <motion.p
        className="serif"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 16,
          textAlign: 'center',
          color: 'var(--on-bg)',
          fontSize: 16,
          whiteSpace: 'pre-line',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1], y: [6, 0] }}
        transition={{ duration: 0.7, delay: FOLD_MS / 1000 + FLY * 0.4, ease: 'easeOut' }}
      >
        {msg}
      </motion.p>
    </div>
  )
}
