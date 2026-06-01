import { useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'

const PARTICLES = 12
const GOLD = '#e7c97a'
const PINK_LID = 'linear-gradient(160deg, #fcd9e3 0%, #f4b9c8 52%, #e89cb0 100%)'
const PINK_BODY = 'linear-gradient(165deg, #f6c2d1 0%, #ecabbd 58%, #df93a8 100%)'
const BLUSH = 'linear-gradient(180deg, #fff5f7 0%, #f6dde4 100%)'
const DROP = 110 // 이만큼 아래로 끌어내리면 함에 담김

function Gem({ size = 86 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 96) / 88} viewBox="0 0 88 96" aria-hidden>
      <g stroke="rgba(150,80,110,0.4)" strokeWidth={0.8} strokeLinejoin="round">
        <polygon points="30,10 58,10 48,38 40,38" fill="#f8d6e0" />
        <polygon points="30,10 40,38 6,38" fill="#edb0c2" />
        <polygon points="58,10 48,38 82,38" fill="#edb0c2" />
        <polygon points="6,38 40,38 44,92" fill="#cf86a0" />
        <polygon points="40,38 48,38 44,92" fill="#e6a0b6" />
        <polygon points="48,38 82,38 44,92" fill="#cf86a0" />
        <polygon points="30,10 40,38 25,30" fill="rgba(255,255,255,0.45)" stroke="none" />
      </g>
    </svg>
  )
}

// 보석함 — 사용자가 종이를 '보석함으로 끌어내리면' 보석으로 접혀 담기고 뚜껑이 닫힌다(직접 행위).
export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  const [stored, setStored] = useState(false)
  const fired = useRef(false)
  const doneRef = useRef(false)

  // onDone을 한 번만 호출 (후광 애니메이션 끝 + 타이머 폴백 둘 중 먼저)
  const finish = () => {
    if (!doneRef.current) {
      doneRef.current = true
      onDone()
    }
  }

  const onDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > DROP && !fired.current) {
      fired.current = true
      setStored(true)
      setTimeout(finish, 2700) // 폴백
    }
    // 덜 내리고 놓으면 dragSnapToOrigin으로 복귀 → 다시 시도
  }

  return (
    <div style={{ position: 'relative', width: 240, height: 300, touchAction: 'none' }}>
      {/* 후광 */}
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
        animate={stored ? { opacity: [0, 0.9, 0], scale: [0.3, 1.1, 1.45] } : {}}
        transition={{ duration: 1.2, delay: 1.2, ease: 'easeOut' }}
        onAnimationComplete={() => {
          if (stored) finish()
        }}
      />

      {/* 빛 입자 */}
      {stored &&
        Array.from({ length: PARTICLES }).map((_, i) => {
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
              transition={{ duration: 1.3, delay: 1.25, ease: 'easeOut' }}
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

      {/* ready: 종이(글)를 잡고 보석함으로 끌어내림 (끌수록 작게 접힘) */}
      {!stored && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDragEnd={onDragEnd}
          whileDrag={{ scale: 0.78, cursor: 'grabbing' }}
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
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          {text}
        </motion.div>
      )}

      {/* stored: 보석으로 접혀 함 속으로 들어가고 뚜껑이 닫힘 */}
      {stored && (
        <>
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 12, marginLeft: -43, zIndex: 4, pointerEvents: 'none' }}
            initial={{ y: 0, scale: 0.7, opacity: 1, rotate: -4 }}
            animate={{ y: [0, 150, 168], scale: [0.7, 0.5, 0.16], opacity: [1, 1, 0], rotate: [-4, 0, 0] }}
            transition={{ duration: 0.7, times: [0, 0.75, 1], ease: 'easeIn' }}
          >
            <Gem />
          </motion.div>

          {/* 뚜껑 */}
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
            initial={{ y: -58, rotate: -24, opacity: 0 }}
            animate={{ y: [-58, -58, 0], rotate: [-24, -24, 0], opacity: [0, 1, 1] }}
            transition={{ duration: 0.55, delay: 0.6, times: [0, 0.2, 1], ease: 'easeIn' }}
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
        </>
      )}

      {/* 상단 행위 안내 캡션 */}
      {!stored && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            💎 종이를 보석함으로 끌어내려 담아보세요
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {stored && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, whiteSpace: 'pre-line', pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
