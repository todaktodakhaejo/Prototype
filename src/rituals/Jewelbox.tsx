import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'
import { hapticJewelStore, hapticHeartbeat, stopVibration } from '../haptics'

const HEARTBEAT_DELAY_MS = 3200 // 보석이 상자에 담긴 뒤 후광이 빛나는 시점과 맞춤

const PARTICLES = 12
const GOLD = '#e7c97a'
const PINK_LID = 'linear-gradient(160deg, #fcd9e3 0%, #f4b9c8 52%, #e89cb0 100%)'
const PINK_BODY = 'linear-gradient(165deg, #f6c2d1 0%, #ecabbd 58%, #df93a8 100%)'
// 누비(퀼팅) 무늬 — 가죽 그라데이션 위에 다이아몬드 스티치
const QUILT =
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 1.5px, rgba(255,255,255,0) 1.5px 19px), repeating-linear-gradient(-45deg, rgba(150,70,100,0.16) 0 1.5px, rgba(150,70,100,0) 1.5px 19px)'
const QUILTED_BODY = `${QUILT}, ${PINK_BODY}`
const QUILTED_LID = `${QUILT}, ${PINK_LID}`
const ZIPPER = 'repeating-linear-gradient(90deg, #fff2cf 0 3px, #c9a24f 3px 6px)' // 골드 지퍼 이빨
const CREAM = 'linear-gradient(180deg, #fbf4ea 0%, #efe3d2 100%)' // 크림 내부(보관 트레이)
const DROP = 110 // 이만큼 아래로 끌어내리면 함에 담김

// 크고 영롱한 브릴리언트컷 다이아몬드 (맑은 무색 + 분광 + 글린트 + 스파클)
function Gem({ size = 104 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ filter: 'drop-shadow(0 0 10px rgba(190,225,255,0.85))' }}>
      {/* 크라운(윗면) */}
      <polygon points="36,12 64,12 74,38 26,38" fill="#eef5fd" />
      <polygon points="8,38 26,38 36,12" fill="#cfe0f1" />
      <polygon points="92,38 74,38 64,12" fill="#cfe0f1" />
      <polygon points="40,15 60,15 56,30 44,30" fill="rgba(255,255,255,0.9)" />
      {/* 거들(가장 넓은 선) */}
      <rect x="8" y="37" width="84" height="2.2" fill="#bcd3ea" />
      {/* 파빌리온(아랫면, 뾰족하게) */}
      <polygon points="8,39 41,39 50,96" fill="#b6cde6" />
      <polygon points="41,39 59,39 50,96" fill="#e3effb" />
      <polygon points="59,39 92,39 50,96" fill="#a6c1df" />
      {/* 무지개빛 분광(파이어) */}
      <polygon points="20,39 33,39 50,96" fill="rgba(120,210,180,0.22)" />
      <polygon points="67,39 80,39 50,96" fill="rgba(180,150,230,0.22)" />
      {/* 밝은 글린트 */}
      <polygon points="41,39 59,39 54,60 46,60" fill="rgba(255,255,255,0.7)" />
      <polygon points="26,38 36,38 30,54" fill="rgba(255,255,255,0.45)" />
      {/* 스파클(4갈래 반짝) */}
      <g fill="#ffffff">
        <path d="M71 19 l2.2 6.2 6.2 2.2 -6.2 2.2 -2.2 6.2 -2.2 -6.2 -6.2 -2.2 6.2 -2.2 z" opacity="0.95" />
        <path d="M33 29 l1.5 4.2 4.2 1.5 -4.2 1.5 -1.5 4.2 -1.5 -4.2 -4.2 -1.5 4.2 -1.5 z" opacity="0.8" />
      </g>
    </svg>
  )
}

// 뚜껑 표면 장식(광택 + 금테 + 손잡이) — 닫힌 뚜껑/닫히는 뚜껑이 공유
function LidDecor() {
  return (
    <>
      <div style={{ position: 'absolute', left: 16, top: 7, width: 96, height: 14, borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 3, height: 6, borderRadius: 3, background: ZIPPER }} />
      <div style={{ position: 'absolute', left: '50%', bottom: -5, marginLeft: -6, width: 12, height: 13, borderRadius: '3px 3px 5px 5px', background: `linear-gradient(180deg, #fff0c8 0%, ${GOLD} 60%, #b8923f 100%)`, boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }} />
    </>
  )
}

// 뚜껑이 들려 열린 상태의 변형(이미지처럼 위로 들려 비스듬히)
// 뚜껑은 '왼쪽 모서리'를 경첩 삼아 열린다(왼쪽 끝이 상자 왼쪽과 딱 맞물려 어긋나지 않게).
const LID_OPEN_DEG = -52

// 보석함 — 닫힌 상자에서 시작, 종이를 드래그하는 순간 뚜껑이 들려 열리고,
//  종이를 끌어내려 담으면 보석으로 접혀 들어가고 뚜껑이 다시 닫힌다(직접 행위).
export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  const [stored, setStored] = useState(false)
  const [open, setOpen] = useState(false) // 뚜껑 열림(드래그 시작 시)
  const [inBox, setInBox] = useState(false) // 보석이 상자로 내려가는 구간(이때만 뚜껑 뒤로)
  const [pull, setPull] = useState(0) // 아래로 끌어내린 정도(px)
  const fired = useRef(false)
  const doneRef = useRef(false)
  const beatRef = useRef<number | null>(null) // 심장박동 햅틱 타이머
  const inBoxRef = useRef<number | null>(null) // z 전환 타이머
  const nearness = Math.min(1, pull / DROP) // 담기는 지점에 얼마나 가까운지(0~1)

  // 화면 이탈 시 진동·예약 타이머 정리
  useEffect(
    () => () => {
      if (beatRef.current !== null) window.clearTimeout(beatRef.current)
      if (inBoxRef.current !== null) window.clearTimeout(inBoxRef.current)
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
      // 중앙 반짝(약 2.3s) 동안은 z를 높여 뚜껑 위에, 이후 내려갈 때만 뚜껑 뒤로
      inBoxRef.current = window.setTimeout(() => setInBox(true), 2300)
      setTimeout(finish, 6800) // 폴백(중앙 반짝 2s + 담기 + 후광 종료 이후)
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
        transition={{ duration: 2.6, delay: 3.2, times: [0, 0.05, 0.2, 0.38, 0.55, 0.75, 0.9, 1], ease: 'easeInOut' }}
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
              transition={{ duration: 1.4, delay: 3.3, ease: 'easeOut' }}
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
          background: QUILTED_BODY,
          boxShadow:
            '0 18px 34px rgba(150,70,95,0.4), inset 0 2px 0 rgba(255,255,255,0.55), inset -8px -10px 20px rgba(176,80,110,0.35)',
        }}
      >
        {/* 크림 내부(보관 트레이) — 칸막이로 보석함 느낌 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 9,
            width: 138,
            height: 34,
            marginLeft: -69,
            borderRadius: 7,
            background: CREAM,
            boxShadow: 'inset 0 4px 8px rgba(120,80,60,0.35), inset 0 0 0 2px rgba(201,162,79,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 3, bottom: 3, left: '33%', width: 2, marginLeft: -1, borderRadius: 2, background: 'rgba(160,120,90,0.3)', boxShadow: '1px 0 0 rgba(255,255,255,0.6)' }} />
          <div style={{ position: 'absolute', top: 3, bottom: 3, left: '66%', width: 2, marginLeft: -1, borderRadius: 2, background: 'rgba(160,120,90,0.3)', boxShadow: '1px 0 0 rgba(255,255,255,0.6)' }} />
          <div style={{ position: 'absolute', left: 4, right: 4, top: '50%', height: 2, marginTop: -1, borderRadius: 2, background: 'rgba(160,120,90,0.3)', boxShadow: '0 1px 0 rgba(255,255,255,0.6)' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: 2,
            height: 6,
            borderRadius: 3,
            background: ZIPPER,
          }}
        />
      </div>

      {/* 뚜껑 — 닫힌 채 시작, 드래그하는 순간 왼쪽 모서리를 축으로 열림(상자 왼쪽과 정렬) */}
      {!stored && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 92,
            width: 162,
            height: 36,
            marginLeft: -81,
            zIndex: 3,
            borderRadius: '14px 14px 6px 6px',
            background: QUILTED_LID,
            boxShadow: '0 -2px 12px rgba(231,201,122,0.3), inset 0 3px 0 rgba(255,255,255,0.7), inset -8px -8px 18px rgba(176,80,110,0.3)',
            transformOrigin: '0% 100%', // 왼쪽-아래 모서리(=상자 왼쪽 끝)를 경첩으로
            transform: open ? `rotate(${LID_OPEN_DEG}deg)` : 'none',
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
          {/* 종이가 작게 말려들며 사라짐(보석으로 변하는 과정) — 화면 중앙에서 */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              top: 60,
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
              pointerEvents: 'none',
            }}
            initial={{ y: 50, scale: 0.78, opacity: 1, rotate: 0 }}
            animate={{ y: [50, 4, -16], scale: [0.78, 0.5, 0.12], opacity: [1, 0.8, 0], rotate: [0, 10, 28], filter: ['blur(0px)', 'blur(1.2px)', 'blur(4px)'] }}
            transition={{ duration: 0.55, times: [0, 0.5, 1], ease: 'easeOut' }}
          >
            {text}
          </motion.div>

          {/* 변하는 순간 반짝 플래시 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 96, width: 140, height: 140, marginLeft: -70, marginTop: -70, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(214,232,255,0.5) 30%, rgba(214,232,255,0) 66%)', zIndex: 6, pointerEvents: 'none' }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.3, 1.7], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />

          {/* 보석이 종이 자리(중앙)에서 피어나 ~2초 반짝인 뒤 함 속으로 떨어져 담김 */}
          <motion.div
            // 반짝일 땐 z30(무조건 뚜껑·상자 앞), 내려갈 때(inBox)만 z3으로 내려 뚜껑에 덮임
            style={{ position: 'absolute', left: '50%', top: 60, marginLeft: -52, zIndex: inBox ? 3 : 30, pointerEvents: 'none' }}
            initial={{ y: 44, scale: 0.18, opacity: 0, rotate: -16 }}
            animate={{ y: [44, -16, -16, 70, 116], scale: [0.18, 1.0, 1.0, 0.7, 0.4], opacity: [0, 1, 1, 1, 0], rotate: [-16, 0, 0, 0, 0] }}
            transition={{ duration: 3.3, times: [0, 0.2, 0.7, 0.92, 1], ease: 'easeInOut' }}
          >
            <Gem />
          </motion.div>

          {/* 중앙에서 반짝이는 동안의 작은 별빛들 */}
          {[
            [50, 54],
            [60, 82],
            [40, 116],
            [64, 70],
            [38, 100],
          ].map(([lx, ty], k) => (
            <motion.span
              key={`tw${k}`}
              style={{ position: 'absolute', left: `${lx}%`, top: ty, width: 9, height: 9, marginLeft: -4.5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 9px 2px rgba(214,232,255,0.95)', zIndex: 6, pointerEvents: 'none' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.3, 1, 0], scale: [0, 1, 0.7, 1, 0.4] }}
              transition={{ duration: 2.2, delay: 0.5 + k * 0.12, times: [0, 0.2, 0.5, 0.75, 1], ease: 'easeInOut' }}
            />
          ))}

          {/* 뚜껑 — 열린 상태(왼쪽 경첩)에서 다시 닫힘 */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 92,
              width: 162,
              height: 36,
              marginLeft: -81,
              zIndex: 5,
              borderRadius: '14px 14px 6px 6px',
              background: QUILTED_LID,
              boxShadow:
                '0 -2px 12px rgba(231,201,122,0.3), inset 0 3px 0 rgba(255,255,255,0.7), inset -8px -8px 18px rgba(176,80,110,0.3)',
              transformOrigin: '0% 100%',
              overflow: 'hidden',
            }}
            initial={{ rotate: LID_OPEN_DEG, opacity: 1 }}
            animate={{ rotate: [LID_OPEN_DEG, LID_OPEN_DEG, 0] }}
            transition={{ duration: 0.8, delay: 2.4, times: [0, 0.2, 1], ease: 'easeIn' }}
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
