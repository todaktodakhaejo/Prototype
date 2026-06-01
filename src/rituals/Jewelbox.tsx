import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'

const TOTAL = 3.8 // 종이 투입 + 뚜껑 + 후광 + 멘트 머무는 총 시간
const PARTICLES = 12 // 빛 입자 개수
const GOLD = '#e7c97a'
const PINK_LID = 'linear-gradient(160deg, #fcd9e3 0%, #f4b9c8 52%, #e89cb0 100%)'
const PINK_BODY = 'linear-gradient(165deg, #f6c2d1 0%, #ecabbd 58%, #df93a8 100%)'
const BLUSH = 'linear-gradient(180deg, #fff5f7 0%, #f6dde4 100%)'

// 보석함 넣기 — 블러시 핑크 보석함(골드 지퍼·광택).
//  종이가 안감 속으로 떨어짐 → 뚜껑이 닫힘 → 골드 후광 + 빛 입자가 퍼지며 '예쁘게 간직'되는 느낌.
export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  useEffect(() => {
    const t = setTimeout(onDone, TOTAL * 1000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{ position: 'relative', width: 240, height: 280 }}>
      {/* 후광 — 닫힌 뒤 보석함 뒤에서 퍼짐 (마지막 애니메이션 → onDone) */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '54%',
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
        transition={{ duration: 1.2, delay: 1.5, ease: 'easeOut' }}
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
              top: '54%',
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
            transition={{ duration: 1.3, delay: 1.55, ease: 'easeOut' }}
          />
        )
      })}

      {/* 종이(글) — 보석함 안감 속으로 떨어져 들어감 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: 6,
          width: 84,
          height: 104,
          marginLeft: -42,
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
          zIndex: 1,
        }}
        initial={{ y: 0, scale: 1, opacity: 1 }}
        animate={{ y: [0, 150, 168], scale: [1, 0.5, 0.15], opacity: [1, 1, 0] }}
        transition={{ duration: 0.9, times: [0, 0.7, 1], ease: 'easeIn' }}
      >
        {text}
      </motion.div>

      {/* 보석함 본체 (아래) */}
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
        {/* 안감(블러시) — 열린 입구로 보이는 속 */}
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
        {/* 골드 지퍼(본체 윗단) */}
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

      {/* 뚜껑 — 위에서 내려와 닫힘 (골드 지퍼 + 클래스프 + 광택) */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 118,
          width: 168,
          height: 60,
          marginLeft: -84,
          zIndex: 3,
          borderRadius: '16px 16px 6px 6px',
          background: PINK_LID,
          boxShadow:
            '0 -2px 12px rgba(231,201,122,0.3), inset 0 3px 0 rgba(255,255,255,0.7), inset -8px -8px 18px rgba(176,80,110,0.3)',
          transformOrigin: '50% 100%',
          overflow: 'hidden',
        }}
        initial={{ y: -58, rotate: -24, opacity: 1 }}
        animate={{ y: [-58, -58, 0], rotate: [-24, -24, 0] }}
        transition={{ duration: 0.6, delay: 0.85, times: [0, 0.2, 1], ease: 'easeIn' }}
      >
        {/* 윗면 광택 하이라이트 */}
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
        {/* 골드 지퍼(뚜껑 아랫단) */}
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
        {/* 지퍼 풀(앞쪽 손잡이) */}
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

      {/* 마무리 멘트 — 보석함이 빛날 때 */}
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
        transition={{ duration: 0.7, delay: 1.6, ease: 'easeOut' }}
      >
        {msg}
      </motion.p>
    </div>
  )
}
