import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, SHRED_MESSAGES } from '../constants'

const CONFETTI = 30
const COLORS = ['#f4b8c7', '#d8b15a', '#fbf7f4', '#c9a7e0', '#9ad0d8']
const GRIND_DIST = 900 // 이만큼(px) 문질러야 다 갈림

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// 파쇄기 — 사용자가 손가락을 좌우로 '마구 문질러' 종이를 갈아 넣는다(직접 행위).
//  세게/많이 문지를수록 본체가 격하게 떨리고 종이가 빨려 들어간다. 다 갈리면 팝콘처럼 터짐.
export default function Shred({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('shred', SHRED_MESSAGES))
  const [progress, setProgress] = useState(0)
  const [grinding, setGrinding] = useState(false)
  const [done, setDone] = useState(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  // 다 갈리면 마무리 (fired 가드 + done deps 제외 → 타이머가 취소되지 않음)
  useEffect(() => {
    if (progress >= 1 && !fired.current) {
      fired.current = true
      setDone(true)
      setGrinding(false)
      const t = setTimeout(onDone, 2700)
      return () => clearTimeout(t)
    }
  }, [progress, onDone])

  const onMove = (e: React.PointerEvent) => {
    if (!grinding || done) return
    const p = { x: e.clientX, y: e.clientY }
    if (last.current) {
      const d = Math.abs(p.x - last.current.x) + Math.abs(p.y - last.current.y)
      setProgress((v) => Math.min(1, v + d / GRIND_DIST))
    }
    last.current = p
  }

  const start = (e: React.PointerEvent) => {
    if (done) return
    setGrinding(true)
    last.current = { x: e.clientX, y: e.clientY }
  }
  const stop = () => {
    setGrinding(false)
    last.current = null
  }

  const fed = progress * 150 // 종이가 슬롯으로 들어간 정도(px)

  return (
    <div
      style={{ position: 'relative', width: 240, height: 280, touchAction: 'none', cursor: done ? 'default' : 'grab' }}
      onPointerDown={start}
      onPointerMove={onMove}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {/* 종이(글) — 슬롯 높이에서 클립. 문지른 만큼 투입구로 빨려 들어감 */}
      <div
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140, overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 6,
            width: 90,
            height: 116,
            marginLeft: -45,
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
            transform: `translateY(${fed}px)`,
          }}
        >
          {text}
        </div>
      </div>

      {/* 파쇄기 본체 — 가는 동안 격하게 흔들림 */}
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
        animate={
          grinding
            ? { x: [0, -8, 8, -9, 9, -7, 7, -4, 0], rotate: [0, -1.6, 1.6, -1.4, 1.2, -1, 0] }
            : { x: 0, rotate: 0 }
        }
        transition={grinding ? { duration: 0.38, repeat: Infinity, ease: 'linear' } : { duration: 0.15 }}
      >
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
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: grinding ? '#ffd24d' : '#7ee0a0',
            boxShadow: grinding ? '0 0 10px 3px rgba(255,200,80,0.9)' : '0 0 8px 2px rgba(126,224,160,0.7)',
          }}
        />
      </motion.div>

      {/* 폭죽 — 다 갈리면 팝콘처럼 터짐 */}
      {done &&
        Array.from({ length: CONFETTI }).map((_, i) => {
          const sx = (rnd(i) - 0.5) * 200
          const up = 120 + rnd(i + 7) * 140
          const fall = 80 + rnd(i + 13) * 90
          const dly = rnd(i + 3) * 0.7
          const dur = 1.1 + rnd(i + 5) * 0.5
          const spin = (rnd(i + 9) < 0.5 ? -1 : 1) * (300 + rnd(i + 11) * 280)
          return (
            <motion.span
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 142,
                width: 6,
                height: 15,
                marginLeft: -3,
                borderRadius: 2,
                background: COLORS[i % COLORS.length],
                zIndex: 3,
              }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.5 }}
              animate={{
                x: [0, sx * 0.5, sx * 0.85, sx],
                y: [0, -up, -up * 0.25, fall],
                opacity: [0, 1, 1, 0],
                rotate: [0, spin * 0.4, spin * 0.8, spin],
                scale: [0.5, 1.15, 1, 0.85],
              }}
              transition={{ duration: dur, delay: dly, times: [0, 0.32, 0.66, 1], ease: 'easeOut' }}
            />
          )
        })}

      {/* 상단 행위 안내 캡션 */}
      {!done && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {progress > 0.02 ? '더 세게 문질러 갈아요' : '🗑️ 좌우로 마구 문질러 갈아보세요'}
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {done && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
