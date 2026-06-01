import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, SHRED_MESSAGES } from '../constants'

const TOTAL = 3.4 // 파쇄 + 폭죽 + 멘트 머무는 총 시간
const CONFETTI = 18 // 폭죽 조각 수
const COLORS = ['#f4b8c7', '#d8b15a', '#fbf7f4', '#c9a7e0', '#9ad0d8']

// 파쇄기:
//  STEP1 종이가 파쇄기 위에 → STEP2 종이가 투입구로 빨려 들어가며 파쇄기가 갈림(진동)
//  STEP3 파쇄된 종이 조각이 투입구에서 폭죽처럼 사방으로 터짐
export default function Shred({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('shred', SHRED_MESSAGES))
  useEffect(() => {
    const t = setTimeout(onDone, TOTAL * 1000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{ position: 'relative', width: 240, height: 280 }}>
      {/* 종이(글) — 투입구로 내려가며 파쇄기 뒤로 사라짐 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: 6,
          width: 90,
          height: 116,
          marginLeft: -45,
          zIndex: 1,
          padding: '12px 10px',
          borderRadius: 4,
          background: 'var(--paper)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          fontFamily: 'var(--batang)',
          fontSize: 10,
          lineHeight: 1.6,
          color: 'var(--ink)',
          textAlign: 'left',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: [0, 120, 150], opacity: [1, 1, 0] }}
        transition={{ duration: 1.2, times: [0, 0.7, 1], ease: 'easeIn' }}
      >
        {text}
      </motion.div>

      {/* 파쇄기 본체 — 종이가 들어갈 때 진동 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 60,
          width: 180,
          height: 96,
          marginLeft: -90,
          zIndex: 2,
          borderRadius: 14,
          background: 'linear-gradient(180deg, #4a4754 0%, #2c2a34 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 16px 30px rgba(0,0,0,0.35)',
        }}
        initial={{ x: 0 }}
        animate={{ x: [0, -3, 3, -3, 3, -2, 0] }}
        transition={{ duration: 0.7, delay: 0.7, ease: 'easeInOut' }}
      >
        {/* 투입구 (어두운 슬롯) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 14,
            width: 130,
            height: 8,
            marginLeft: -65,
            borderRadius: 4,
            background: '#15131a',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
          }}
        />
        {/* 작은 작동 표시등 */}
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#7ee0a0',
            boxShadow: '0 0 8px 2px rgba(126,224,160,0.7)',
          }}
        />
      </motion.div>

      {/* 폭죽 — 투입구에서 파쇄 조각이 사방으로 터짐 */}
      {Array.from({ length: CONFETTI }).map((_, i) => {
        const angle = (i / CONFETTI) * Math.PI * 2 + (i % 2 ? 0.18 : -0.18)
        const dist = 110 + (i % 4) * 22
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist - 40 // 위로 살짝 솟구치는 폭죽 느낌
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 142, // 투입구 부근
              width: 5,
              height: 13,
              marginLeft: -2.5,
              borderRadius: 2,
              background: COLORS[i % COLORS.length],
              zIndex: 3,
            }}
            initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
            animate={{
              x: [0, dx],
              y: [0, dy, dy + 70], // 솟구쳤다가 중력으로 떨어짐
              opacity: [0, 1, 1, 0],
              rotate: [0, (i % 2 ? 1 : -1) * 200],
            }}
            transition={{ duration: 1.3, delay: 1.3, times: [0, 0.3, 0.7, 1], ease: 'easeOut' }}
          />
        )
      })}

      {/* 마무리 멘트 — 폭죽과 함께 */}
      <motion.p
        className="serif"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 12,
          textAlign: 'center',
          color: 'var(--on-bg)',
          fontSize: 16,
          whiteSpace: 'pre-line',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1], y: [6, 0] }}
        transition={{ duration: 0.7, delay: 1.5, ease: 'easeOut' }}
      >
        {msg}
      </motion.p>
    </div>
  )
}
