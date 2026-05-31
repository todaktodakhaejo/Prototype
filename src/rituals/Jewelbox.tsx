import { motion } from 'framer-motion'
import type { RitualProps } from './index'

const DURATION = 2.8
const PARTICLES = 12 // 빛 입자 개수

// 보석함 넣기:
//  STEP1 보석함 등장 + 종이 → STEP2 종이가 보석함 안으로 들어감 → 뚜껑 닫힘
//  STEP3 보석함 뒤에서 후광 + 빛 입자가 사방으로 퍼짐(간직되는 느낌)
export default function Jewelbox({ text, onDone }: RitualProps) {
  return (
    <div style={{ position: 'relative', width: 220, height: 260 }}>
      {/* 후광 — 닫힌 뒤 보석함 뒤에서 퍼짐 (마지막 애니메이션 → onDone 트리거) */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '52%',
          width: 220,
          height: 220,
          marginLeft: -110,
          marginTop: -110,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,247,224,0.9) 0%, rgba(216,177,90,0.35) 45%, rgba(216,177,90,0) 70%)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.1, 1.4] }}
        transition={{ duration: 1.2, delay: 1.5, ease: 'easeOut' }}
        onAnimationComplete={onDone}
      />

      {/* 빛 입자 — 후광과 함께 사방으로 */}
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        const dist = 90 + (i % 3) * 16
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '52%',
              width: 6,
              height: 6,
              marginLeft: -3,
              marginTop: -3,
              borderRadius: '50%',
              background: 'rgba(255,250,235,0.95)',
              boxShadow: '0 0 8px 2px rgba(216,177,90,0.7)',
              pointerEvents: 'none',
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: [0, 1, 0],
              scale: [0.4, 1, 0.6],
            }}
            transition={{ duration: 1.3, delay: 1.55, ease: 'easeOut' }}
          />
        )
      })}

      {/* 종이(글) — 보석함 안으로 떨어져 들어감 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: 8,
          width: 84,
          height: 108,
          marginLeft: -42,
          padding: '10px 8px',
          borderRadius: 4,
          background: 'var(--paper)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          fontFamily: 'var(--batang)',
          fontSize: 9,
          lineHeight: 1.5,
          color: 'var(--ink)',
          textAlign: 'left',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        initial={{ y: 0, scale: 1, opacity: 1 }}
        animate={{ y: [0, 150, 168], scale: [1, 0.5, 0.15], opacity: [1, 1, 0] }}
        transition={{ duration: 0.9, times: [0, 0.7, 1], ease: 'easeIn' }}
      >
        {text}
      </motion.div>

      {/* 보석함 본체 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 30,
          width: 150,
          height: 86,
          marginLeft: -75,
          borderRadius: '8px 8px 12px 12px',
          background: 'linear-gradient(180deg, #4a3866 0%, #2c2040 100%)',
          border: '1px solid rgba(216,177,90,0.55)',
          boxShadow: '0 14px 30px rgba(0,0,0,0.35), inset 0 2px 0 rgba(216,177,90,0.25)',
        }}
      />

      {/* 뚜껑 — 위에서 내려와 닫힘 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 112,
          width: 158,
          height: 30,
          marginLeft: -79,
          borderRadius: '12px 12px 4px 4px',
          background: 'linear-gradient(180deg, #5a4680 0%, #3a2b54 100%)',
          border: '1px solid rgba(216,177,90,0.7)',
          boxShadow: '0 -2px 10px rgba(216,177,90,0.25)',
          transformOrigin: '50% 100%',
        }}
        initial={{ y: -56, rotate: -22, opacity: 1 }}
        animate={{ y: [-56, -56, 0], rotate: [-22, -22, 0] }}
        transition={{ duration: 0.6, delay: 0.85, times: [0, 0.2, 1], ease: 'easeIn' }}
      />
    </div>
  )
}
