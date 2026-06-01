import { useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, PLANE_MESSAGES } from '../constants'

const MOTES = 6
const FLICK = 450 // 이 속도(px/s) 이상으로 튕겨야 날아감

// 날리기 — 사용자가 종이를 잡고 '휙 던지면(플릭)' 그 방향·세기로 날아간다(직접 행위).
export default function Plane({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('plane', PLANE_MESSAGES))
  const [flying, setFlying] = useState(false)
  const [dir, setDir] = useState({ x: 0.6, y: -1 })

  const onDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const vx = info.velocity.x
    const vy = info.velocity.y
    const speed = Math.hypot(vx, vy)
    if (speed > FLICK && !flying) {
      const m = speed || 1
      setDir({ x: vx / m, y: Math.min(vy / m, -0.35) }) // 항상 살짝 위로 날아가게
      setFlying(true)
      setTimeout(onDone, 2600)
    }
    // 약하게 놓으면 dragSnapToOrigin으로 제자리 복귀 → 다시 시도
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

      {/* ready: 종이(글)를 잡고 휙 던질 수 있음 */}
      {!flying && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.6}
          onDragEnd={onDragEnd}
          whileDrag={{ scale: 1.04, cursor: 'grabbing' }}
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
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          {text}
        </motion.div>
      )}

      {/* flying: 던진 방향·세기로 날아감 */}
      {flying && (
        <>
          <motion.div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
            initial={{ x: 0, y: 0, scale: 0.55, opacity: 0, rotate: 0 }}
            animate={{
              x: [0, dir.x * 110, dir.x * 620],
              y: [0, dir.y * 110, dir.y * 600],
              scale: [0.55, 1, 0.18],
              opacity: [0, 1, 0],
              rotate: [0, dir.x * 18, dir.x * 26],
            }}
            transition={{ duration: 1.7, times: [0, 0.22, 1], ease: 'easeOut' }}
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
              <svg width={120} height={90} viewBox="0 0 120 90" aria-hidden style={{ position: 'relative' }}>
                <polygon points="10,82 112,8 60,56" fill="#ffffff" />
                <polygon points="112,8 60,56 80,82" fill="#efe7dd" />
              </svg>
            </div>
          </motion.div>
        </>
      )}

      {/* 안내 / 마무리 멘트 */}
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
          opacity: 0.85,
          pointerEvents: 'none',
        }}
        animate={{ opacity: flying ? [0, 1] : 0.85 }}
        transition={{ duration: 0.7, delay: flying ? 0.9 : 0 }}
      >
        {flying ? msg : '종이를 잡고 휙 던져 보내세요'}
      </motion.p>
    </div>
  )
}
