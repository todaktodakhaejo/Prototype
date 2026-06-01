import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'

const FOLD_MS = 1100 // 종이가 보석 모양으로 접히는 시간
const TOTAL = 4100 // 전체(접기 + 담기 + 뚜껑 + 빛 + 멘트)
const PARTICLES = 12
const GOLD = '#e7c97a'
const PINK_LID = 'linear-gradient(160deg, #fcd9e3 0%, #f4b9c8 52%, #e89cb0 100%)'
const PINK_BODY = 'linear-gradient(165deg, #f6c2d1 0%, #ecabbd 58%, #df93a8 100%)'
const BLUSH = 'linear-gradient(180deg, #fff5f7 0%, #f6dde4 100%)'

// 면이 진 로즈 보석(다이아) — 종이가 이 모양으로 접힌다.
function Gem({ size = 86 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 96) / 88} viewBox="0 0 88 96" aria-hidden>
      <g stroke="rgba(150,80,110,0.4)" strokeWidth={0.8} strokeLinejoin="round">
        {/* 크라운(윗면) */}
        <polygon points="30,10 58,10 48,38 40,38" fill="#f8d6e0" />
        <polygon points="30,10 40,38 6,38" fill="#edb0c2" />
        <polygon points="58,10 48,38 82,38" fill="#edb0c2" />
        {/* 퍼빌리언(아래 뾰족) */}
        <polygon points="6,38 40,38 44,92" fill="#cf86a0" />
        <polygon points="40,38 48,38 44,92" fill="#e6a0b6" />
        <polygon points="48,38 82,38 44,92" fill="#cf86a0" />
        {/* 윗면 광택 */}
        <polygon points="30,10 40,38 25,30" fill="rgba(255,255,255,0.45)" stroke="none" />
      </g>
    </svg>
  )
}

// 보석함 — 종이를 보석 모양으로 접어(fold), 함에 담고(store), 뚜껑을 닫아 간직한다.
export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  const [phase, setPhase] = useState<'fold' | 'store'>('fold')
  const F = FOLD_MS / 1000

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('store'), FOLD_MS) // 접힘 끝 → 종이 언마운트, 보석 등장
    const t2 = setTimeout(onDone, TOTAL)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div style={{ position: 'relative', width: 240, height: 300 }}>
      {/* 후광 — 담긴 뒤 보석함 뒤에서 퍼짐 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '58%',
          width: 230,
          height: 230,
          marginLeft: -115,
          marginTop: -115,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,247,224,0.95) 0%, rgba(231,201,122,0.4) 42%, rgba(231,201,122,0) 70%)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.1, 1.45] }}
        transition={{ duration: 1.2, delay: F + 1.5, ease: 'easeOut' }}
      />

      {/* 빛 입자 */}
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        const dist = 92 + (i % 3) * 16
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '58%',
              width: 6,
              height: 6,
              marginLeft: -3,
              marginTop: -3,
              borderRadius: '50%',
              background: 'rgba(255,250,235,0.95)',
              boxShadow: '0 0 9px 2px rgba(231,201,122,0.8)',
              pointerEvents: 'none',
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
            transition={{ duration: 1.3, delay: F + 1.55, ease: 'easeOut' }}
          />
        )
      })}

      {/* 보석함 본체 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 34,
          width: 162,
          height: 92,
          marginLeft: -81,
          zIndex: 2,
          borderRadius: '12px 12px 18px 18px',
          background: PINK_BODY,
          boxShadow:
            '0 18px 34px rgba(150,70,95,0.4), inset 0 2px 0 rgba(255,255,255,0.55), inset -8px -10px 20px rgba(176,80,110,0.35)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 9,
            width: 138,
            height: 34,
            marginLeft: -69,
            borderRadius: '8px 8px 10px 10px',
            background: BLUSH,
            boxShadow: 'inset 0 5px 9px rgba(150,70,95,0.4)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: 2,
            height: 5,
            borderRadius: 3,
            background: `linear-gradient(180deg, #fff0c8 0%, ${GOLD} 55%, #c9a24f 100%)`,
          }}
        />
      </div>

      {/* fold 단계: 종이(글)가 접히며 보석 모양으로 모임 → store 단계가 되면 언마운트 */}
      {phase === 'fold' && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: 10,
            width: 86,
            height: 104,
            marginLeft: -43,
            zIndex: 4,
            padding: '10px 8px',
            borderRadius: 4,
            background: 'var(--paper)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
            fontFamily: 'var(--batang)',
            fontSize: 9,
            lineHeight: 1.5,
            color: 'var(--ink)',
            textAlign: 'left',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            transformOrigin: 'center',
          }}
          initial={{ scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 }}
          animate={{ scaleX: [1, 0.62, 0.5], scaleY: [1, 0.86, 0.96], rotate: [0, 6, 0], opacity: [1, 1, 0.15] }}
          transition={{ duration: F, times: [0, 0.6, 1], ease: 'easeInOut' }}
        >
          {text}
        </motion.div>
      )}

      {/* store 단계: 보석이 나타나(접힘 완성) 함 속으로 쏙 들어감 */}
      {phase === 'store' && (
        <motion.div
          style={{ position: 'absolute', left: '50%', top: 12, marginLeft: -43, zIndex: 4, pointerEvents: 'none' }}
          initial={{ y: 0, scale: 0.5, opacity: 0, rotate: -6 }}
          animate={{ y: [0, 0, 150, 168], scale: [0.5, 1, 0.5, 0.16], opacity: [0, 1, 1, 0], rotate: [-6, 0, 0, 0] }}
          transition={{ duration: 1.0, times: [0, 0.26, 0.85, 1], ease: 'easeIn' }}
        >
          <Gem />
        </motion.div>
      )}

      {/* 뚜껑 — 보석이 담긴 뒤 위에서 내려와 닫힘 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 118,
          width: 168,
          height: 60,
          marginLeft: -84,
          zIndex: 5,
          borderRadius: '16px 16px 6px 6px',
          background: PINK_LID,
          boxShadow:
            '0 -2px 12px rgba(231,201,122,0.3), inset 0 3px 0 rgba(255,255,255,0.7), inset -8px -8px 18px rgba(176,80,110,0.3)',
          transformOrigin: '50% 100%',
          overflow: 'hidden',
        }}
        initial={{ y: -58, rotate: -24, opacity: 1 }}
        animate={{ y: [-58, -58, 0], rotate: [-24, -24, 0] }}
        transition={{ duration: 0.55, delay: F + 0.9, times: [0, 0.2, 1], ease: 'easeIn' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: 8,
            width: 90,
            height: 16,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(1px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 2,
            height: 5,
            borderRadius: 3,
            background: `linear-gradient(180deg, #fff0c8 0%, ${GOLD} 55%, #c9a24f 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -4,
            marginLeft: -5,
            width: 10,
            height: 12,
            borderRadius: '3px 3px 5px 5px',
            background: `linear-gradient(180deg, #fff0c8 0%, ${GOLD} 60%, #b8923f 100%)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          }}
        />
      </motion.div>

      {/* 마무리 멘트 */}
      <motion.p
        className="serif"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 4,
          textAlign: 'center',
          color: 'var(--on-bg)',
          fontSize: 16,
          whiteSpace: 'pre-line',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1], y: [6, 0] }}
        transition={{ duration: 0.7, delay: F + 1.6, ease: 'easeOut' }}
      >
        {msg}
      </motion.p>
    </div>
  )
}
