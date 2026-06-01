import { useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, PLANE_MESSAGES } from '../constants'

const MOTES = 6

// 종이비행기 SVG
function PaperPlane() {
  return (
    <svg width={120} height={90} viewBox="0 0 120 90" aria-hidden style={{ position: 'relative' }}>
      <polygon points="10,82 112,8 60,56" fill="#ffffff" />
      <polygon points="112,8 60,56 80,82" fill="#efe7dd" />
    </svg>
  )
}

// 날리기 — 종이를 '탭하면 비행기로 접히고', 그 비행기를 '던지면(드래그-놓기)' 날아간다(seamless).
//  paper(탭) → plane(던질 수 있음) → flying(날아가고 onAnimationComplete로 완료).
export default function Plane({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('plane', PLANE_MESSAGES))
  const [phase, setPhase] = useState<'paper' | 'plane' | 'flying'>('paper')
  const [dir, setDir] = useState({ x: 0.5, y: -1 })
  const fired = useRef(false)

  const onThrow = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (fired.current) return
    fired.current = true
    let dx = info.offset.x
    let dy = info.offset.y
    if (Math.hypot(dx, dy) < 20) {
      dx = 30
      dy = -60
    } // 거의 안 움직이고 놓으면 기본으로 위로
    const m = Math.hypot(dx, dy) || 1
    setDir({ x: dx / m, y: Math.min(dy / m, -0.3) }) // 항상 살짝 위로
    setPhase('flying')
  }

  return (
    <div style={{ position: 'relative', width: 240, height: 320, touchAction: 'none' }}>
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

      {/* paper: 종이(글) — 탭하면 비행기로 접힘 */}
      {phase === 'paper' && (
        <motion.div
          onTap={() => setPhase('plane')}
          whileTap={{ scale: 0.97 }}
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
            cursor: 'pointer',
            touchAction: 'none',
          }}
          exit={{ opacity: 0 }}
        >
          {text}
        </motion.div>
      )}

      {/* plane: 접힌 비행기 — 잡고 던질 수 있음 */}
      {phase === 'plane' && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDragEnd={onThrow}
          whileDrag={{ cursor: 'grabbing' }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none',
          }}
          // 종이가 막 접혀 비행기가 된 느낌(가로로 펴지며 등장) + 살짝 둥실
          initial={{ scaleX: 0.3, scaleY: 0.6, opacity: 0 }}
          animate={{ scaleX: 1, scaleY: 1, opacity: 1, y: [0, -6, 0] }}
          transition={{ scaleX: { duration: 0.45 }, scaleY: { duration: 0.45 }, opacity: { duration: 0.3 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <PaperPlane />
        </motion.div>
      )}

      {/* flying: 던진 방향·세기로 날아감 → 끝나면 onDone */}
      {phase === 'flying' && (
        <motion.div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            x: [0, dir.x * 110, dir.x * 620],
            y: [0, dir.y * 110, dir.y * 600],
            scale: [1, 0.9, 0.16],
            opacity: [1, 1, 0],
            rotate: [0, dir.x * 16, dir.x * 26],
          }}
          transition={{ duration: 1.6, times: [0, 0.25, 1], ease: 'easeOut' }}
          onAnimationComplete={() => onDone()}
        >
          <div style={{ position: 'relative' }}>
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
            <PaperPlane />
          </div>
        </motion.div>
      )}

      {/* 상단 행위 안내 캡션 */}
      {phase !== 'flying' && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {phase === 'paper' ? '👆 종이를 탭하면 비행기로 접혀요' : '✈️ 비행기를 휙 던지세요'}
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {phase === 'flying' && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, whiteSpace: 'pre-line', pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
