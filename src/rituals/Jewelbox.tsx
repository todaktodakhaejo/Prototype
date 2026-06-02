import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'
import { hapticJewelStore, hapticHeartbeat, stopVibration } from '../haptics'

const HEARTBEAT_DELAY_MS = 2000 // 후광이 빛나기 시작하는 시점(후광 delay 2.0s)과 맞춤

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

// 뚜껑 표면 장식(광택 + 금테 + 손잡이) — 닫힌 뚜껑/닫히는 뚜껑이 공유
function LidDecor() {
  return (
    <>
      <div style={{ position: 'absolute', left: 16, top: 7, width: 96, height: 14, borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 3, height: 6, borderRadius: 3, background: `linear-gradient(180deg, #fff0c8 0%, ${GOLD} 55%, #c9a24f 100%)` }} />
      <div style={{ position: 'absolute', left: '50%', bottom: -5, marginLeft: -6, width: 12, height: 13, borderRadius: '3px 3px 5px 5px', background: `linear-gradient(180deg, #fff0c8 0%, ${GOLD} 60%, #b8923f 100%)`, boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }} />
    </>
  )
}

// 뚜껑이 들려 열린 상태의 변형(이미지처럼 위로 들려 비스듬히)
const LID_OPEN = { x: 20, y: -98, rotate: -44 }

// 보석함 — 닫힌 상자에서 시작, 종이를 드래그하는 순간 뚜껑이 들려 열리고,
//  종이를 끌어내려 담으면 보석으로 접혀 들어가고 뚜껑이 다시 닫힌다(직접 행위).
export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  const [stored, setStored] = useState(false)
  const [open, setOpen] = useState(false) // 뚜껑 열림(드래그 시작 시)
  const [pull, setPull] = useState(0) // 아래로 끌어내린 정도(px)
  const fired = useRef(false)
  const doneRef = useRef(false)
  const beatRef = useRef<number | null>(null) // 심장박동 햅틱 타이머
  const nearness = Math.min(1, pull / DROP) // 담기는 지점에 얼마나 가까운지(0~1)

  // 화면 이탈 시 진동·예약 타이머 정리
  useEffect(
    () => () => {
      if (beatRef.current !== null) window.clearTimeout(beatRef.current)
      stopVibration()
    },
    [],
  )

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
      hapticJewelStore() // 함에 넣는 순간 부드러운 진동
      // 후광이 빛나기 시작할 때 따뜻한 심장박동 진동
      beatRef.current = window.setTimeout(hapticHeartbeat, HEARTBEAT_DELAY_MS)
      setTimeout(finish, 5000) // 폴백(후광 종료 4.6s 이후) — onAnimationComplete가 먼저 끝냄
    } else {
      setPull(0) // 덜 내리고 놓으면 복귀 → 입구 빛도 가라앉음
      setOpen(false) // 뚜껑 다시 닫힘
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
        // 심장박동 3회(두근…두근…두근)에 맞춰 밝기가 은은하게 세 번 차올랐다 잦아듦.
        //   대비를 부드럽게(0.42~0.78), 진동 길이(≈2.1s)에 맞춰 느긋하게(duration 2.6s).
        animate={stored ? { opacity: [0, 0.78, 0.42, 0.78, 0.42, 0.78, 0.28, 0], scale: [0.5, 0.72, 0.82, 0.95, 1.05, 1.2, 1.32, 1.45] } : {}}
        transition={{ duration: 2.6, delay: 2.0, times: [0, 0.05, 0.2, 0.38, 0.55, 0.75, 0.9, 1], ease: 'easeInOut' }}
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
              transition={{ duration: 1.4, delay: 2.05, ease: 'easeOut' }}
            />
          )
        })}

      {/* 입구 강조 — 종이를 가까이 끌수록 보석함 입구가 빛나고 빛기둥이 올라옴 */}
      {!stored && nearness > 0.02 && (
        <>
          {/* 입구에서 위로 솟는 빛기둥 */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              marginLeft: -42,
              bottom: 116,
              width: 84,
              height: 24 + nearness * 86,
              borderRadius: '42px 42px 0 0',
              background: 'linear-gradient(0deg, rgba(255,247,224,0.6) 0%, rgba(255,247,224,0) 100%)',
              filter: 'blur(5px)',
              opacity: nearness,
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />
          {/* 입구 표면의 밝은 타원 (벌어지듯 가로로 커짐) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              marginLeft: -60,
              bottom: 116,
              width: 120,
              height: 20,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,250,235,0.95) 0%, rgba(231,201,122,0) 72%)',
              opacity: nearness,
              transform: `scaleX(${0.7 + nearness * 0.5}) scaleY(${0.8 + nearness * 0.4})`,
              filter: 'blur(1px)',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />
        </>
      )}

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

      {/* 뚜껑 — 닫힌 채 시작, 드래그하는 순간 위로 들려 비스듬히 열림(이미지 참고) */}
      {!stored && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 84,
            width: 170,
            height: 40,
            marginLeft: -85,
            zIndex: 3,
            borderRadius: '14px 14px 6px 6px',
            background: PINK_LID,
            boxShadow: '0 -2px 12px rgba(231,201,122,0.3), inset 0 3px 0 rgba(255,255,255,0.7), inset -8px -8px 18px rgba(176,80,110,0.3)',
            transformOrigin: '50% 100%',
            transform: open ? `translate(${LID_OPEN.x}px, ${LID_OPEN.y}px) rotate(${LID_OPEN.rotate}deg)` : 'none',
            transition: 'transform 0.28s ease-out',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <LidDecor />
        </div>
      )}

      {/* ready: 종이(글)를 잡고 보석함으로 끌어내림 (끌수록 작게 접힘) */}
      {!stored && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDragStart={() => setOpen(true)}
          onDrag={(_e, info) => setPull(Math.max(0, info.offset.y))}
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
            transition={{ duration: 1.2, times: [0, 0.78, 1], ease: 'easeIn' }}
          >
            <Gem />
          </motion.div>

          {/* 뚜껑 — 열린 상태에서 다시 닫힘 */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 84,
              width: 170,
              height: 40,
              marginLeft: -85,
              zIndex: 5,
              borderRadius: '14px 14px 6px 6px',
              background: PINK_LID,
              boxShadow:
                '0 -2px 12px rgba(231,201,122,0.3), inset 0 3px 0 rgba(255,255,255,0.7), inset -8px -8px 18px rgba(176,80,110,0.3)',
              transformOrigin: '50% 100%',
              overflow: 'hidden',
            }}
            initial={{ x: LID_OPEN.x, y: LID_OPEN.y, rotate: LID_OPEN.rotate, opacity: 1 }}
            animate={{ x: [LID_OPEN.x, LID_OPEN.x, 0], y: [LID_OPEN.y, LID_OPEN.y, 0], rotate: [LID_OPEN.rotate, LID_OPEN.rotate, 0] }}
            transition={{ duration: 0.8, delay: 0.9, times: [0, 0.2, 1], ease: 'easeIn' }}
          >
            <LidDecor />
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
          transition={{ duration: 0.8, delay: 2.4 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
