import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'
import { hapticJewelStore, hapticHeartbeat, stopVibration } from '../haptics'

const HEARTBEAT_DELAY_MS = 3200 // 보석이 담긴 뒤 후광이 빛나는 시점과 맞춤
const PARTICLES = 12
const DROP = 110 // 이만큼 아래로 끌어내리면 함에 담김

// 네이비 가죽 + 크림 새틴(고급 보석함)
const LEATHER = 'linear-gradient(150deg, #45557a 0%, #303c5c 48%, #222c47 78%, #1a2238 100%)'
const LEATHER_EDGE = 'linear-gradient(180deg, #54648c 0%, #2a3450 100%)'
const SATIN = 'linear-gradient(180deg, #f3ebdb 0%, #e6d8c2 60%, #d8c8ad 100%)'
const SATIN_DEEP = 'linear-gradient(180deg, #ece1cd 0%, #d7c6aa 100%)'
const GOLD = 'linear-gradient(180deg, #fbe9b0 0%, #d9b25e 55%, #b88e3c 100%)'

// 이미 담긴 작은 보석 색 — 매번 다르되 파스텔(새 보석이 묻히지 않게)
const PASTELS = ['#f7c5d6', '#d3c0f2', '#bfe3e8', '#d9edc2', '#f7e3a6', '#f4cbb6', '#cdd9f6', '#ecc6e6']
function pickPastels(n: number): string[] {
  const a = [...PASTELS]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

// 작은 파스텔 보석(브릴리언트컷 단순화)
function MiniGem({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgba(40,30,40,0.3))' }}>
      <polygon points="8,15 20,6 32,15 20,38" fill={color} />
      <polygon points="8,15 20,6 20,16" fill="#ffffff" opacity="0.6" />
      <polygon points="32,15 20,6 20,16" fill="#ffffff" opacity="0.3" />
      <polygon points="8,15 20,16 20,38" fill="#ffffff" opacity="0.2" />
      <polygon points="32,15 20,16 20,38" fill="#2a1f2a" opacity="0.12" />
    </svg>
  )
}

// 담는 보석 — 크고 영롱한 무색 다이아몬드
function Gem({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ filter: 'drop-shadow(0 0 10px rgba(190,225,255,0.85))' }}>
      <polygon points="36,12 64,12 74,38 26,38" fill="#eef5fd" />
      <polygon points="8,38 26,38 36,12" fill="#cfe0f1" />
      <polygon points="92,38 74,38 64,12" fill="#cfe0f1" />
      <polygon points="40,15 60,15 56,30 44,30" fill="rgba(255,255,255,0.9)" />
      <rect x="8" y="37" width="84" height="2.2" fill="#bcd3ea" />
      <polygon points="8,39 41,39 50,96" fill="#b6cde6" />
      <polygon points="41,39 59,39 50,96" fill="#e3effb" />
      <polygon points="59,39 92,39 50,96" fill="#a6c1df" />
      <polygon points="20,39 33,39 50,96" fill="rgba(120,210,180,0.22)" />
      <polygon points="67,39 80,39 50,96" fill="rgba(180,150,230,0.22)" />
      <polygon points="41,39 59,39 54,60 46,60" fill="rgba(255,255,255,0.7)" />
      <polygon points="26,38 36,38 30,54" fill="rgba(255,255,255,0.45)" />
      <g fill="#ffffff">
        <path d="M71 19 l2.2 6.2 6.2 2.2 -6.2 2.2 -2.2 6.2 -2.2 -6.2 -6.2 -2.2 6.2 -2.2 z" opacity="0.95" />
        <path d="M33 29 l1.5 4.2 4.2 1.5 -4.2 1.5 -1.5 4.2 -1.5 -4.2 -4.2 -1.5 4.2 -1.5 z" opacity="0.8" />
      </g>
    </svg>
  )
}

// 이미 담긴 보석들의 자리(상자 안쪽, 화면 좌표 기준 — 새 보석은 가운데 빈자리에 안착)
const SLOTS = [
  { x: -60, y: 198 },
  { x: -31, y: 206 },
  { x: 31, y: 206 },
  { x: 60, y: 198 },
]
const NEW_SLOT = { x: 0, y: 210 }

// 보석함 — 닫힌 가죽 상자에서 시작, 종이를 드래그하면 뚜껑이 열려 크림 새틴 내부(파스텔 보석들)가
//  보이고, 종이가 다이아몬드로 변해 그 사이에 담긴다.
export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  const [stored, setStored] = useState(false)
  const [open, setOpen] = useState(false) // 뚜껑 열림(드래그 시작 시)
  const [storedColors] = useState(() => pickPastels(4)) // 이미 담긴 4개(파스텔, 매번 다름)
  const fired = useRef(false)
  const doneRef = useRef(false)
  const beatRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (beatRef.current !== null) window.clearTimeout(beatRef.current)
      stopVibration()
    },
    [],
  )

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
      hapticJewelStore()
      beatRef.current = window.setTimeout(hapticHeartbeat, HEARTBEAT_DELAY_MS)
      setTimeout(finish, 6800)
    } else {
      setOpen(false)
    }
  }

  const showInside = open || stored // 뚜껑이 열려 내부가 보이는 상태

  return (
    <div style={{ position: 'relative', width: 240, height: 300, touchAction: 'none' }}>
      {/* 후광 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '64%',
          width: 230,
          height: 230,
          marginLeft: -115,
          marginTop: -115,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,247,224,0.9) 0%, rgba(231,201,122,0.36) 42%, rgba(231,201,122,0) 70%)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={stored ? { opacity: [0, 0.7, 0.4, 0.7, 0.4, 0.7, 0.26, 0], scale: [0.5, 0.72, 0.82, 0.95, 1.05, 1.2, 1.32, 1.45] } : {}}
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
              style={{ position: 'absolute', left: '50%', top: '64%', width: 6, height: 6, marginLeft: -3, marginTop: -3, borderRadius: '50%', background: 'rgba(255,250,235,0.95)', boxShadow: '0 0 9px 2px rgba(231,201,122,0.8)', pointerEvents: 'none' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
              transition={{ duration: 1.4, delay: 3.3, ease: 'easeOut' }}
            />
          )
        })}

      {/* ===== 고급 보석함 (네이비 가죽 + 크림 새틴 내부) ===== */}
      <div style={{ position: 'absolute', left: '50%', bottom: 22, width: 210, height: 150, marginLeft: -105, zIndex: 2 }}>
        {/* 가죽 본체 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: LEATHER,
            boxShadow: '0 22px 40px rgba(20,26,45,0.5), inset 0 2px 0 rgba(255,255,255,0.18), inset 0 -10px 22px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* 가죽 결(미세 비늘 결) */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.5, background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0.05) 2px 5px)' }} />
        </div>

        {/* 크림 새틴 내부 — 위가 좁은 사다리꼴(상자 안을 들여다보는 원근) */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 12,
            height: 96,
            background: SATIN,
            clipPath: 'polygon(9% 0, 91% 0, 100% 100%, 0 100%)',
            boxShadow: 'inset 0 12px 20px rgba(120,90,60,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* 안쪽 새틴 음영(깊이) */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 30, background: 'linear-gradient(180deg, rgba(110,80,55,0.4) 0%, rgba(110,80,55,0) 100%)' }} />
          {/* 칸막이 — 반지 보관용 둥근 이랑 3줄 */}
          {[58, 70, 82].map((ty, i) => (
            <div key={i} style={{ position: 'absolute', left: 18 + i * 2, right: 18 + i * 2, top: ty, height: 6, borderRadius: 6, background: SATIN_DEEP, boxShadow: '0 1px 0 rgba(255,255,255,0.7), 0 -2px 3px rgba(120,90,60,0.25)' }} />
          ))}
        </div>

        {/* 앞면(전면 벽) 골드 트림 + 잠금쇠 */}
        <div style={{ position: 'absolute', left: 10, right: 10, top: 104, height: 3, borderRadius: 2, background: GOLD, opacity: 0.85 }} />
        <div style={{ position: 'absolute', left: '50%', top: 116, width: 30, height: 18, marginLeft: -15, borderRadius: 4, background: GOLD, boxShadow: '0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)' }} />
      </div>

      {/* 이미 담긴 파스텔 보석들 (뚜껑 열리면 보임) */}
      {showInside &&
        storedColors.map((c, i) => (
          <motion.div
            key={`stored${i}`}
            style={{ position: 'absolute', left: '50%', top: SLOTS[i].y, marginLeft: SLOTS[i].x - 12, zIndex: 4, pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.5, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
          >
            <MiniGem color={c} size={i === 0 || i === 3 ? 22 : 26} />
          </motion.div>
        ))}

      {/* 뚜껑 (닫힘) — 가죽 슬래브가 상자 위를 덮음. 드래그 전. */}
      {!showInside && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 150,
            width: 210,
            height: 30,
            marginLeft: -105,
            zIndex: 6,
            borderRadius: '14px 14px 6px 6px',
            background: LEATHER_EDGE,
            boxShadow: '0 6px 14px rgba(20,26,45,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
          }}
        >
          <div style={{ position: 'absolute', left: '50%', bottom: -7, width: 30, height: 14, marginLeft: -15, borderRadius: 4, background: GOLD, boxShadow: '0 2px 4px rgba(0,0,0,0.35)' }} />
        </div>
      )}

      {/* 뚜껑 (열림) — 뒤로 기대 선 가죽 패널 + 크림 안감 + 목걸이 걸이 슬릿 */}
      {showInside && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 168,
            width: 206,
            height: 92,
            marginLeft: -103,
            zIndex: 1,
            transformOrigin: '50% 100%',
            borderRadius: '12px 12px 4px 4px',
            background: LEATHER,
            boxShadow: '0 -8px 18px rgba(20,26,45,0.35), inset 0 2px 0 rgba(255,255,255,0.16)',
            padding: 9,
          }}
          initial={{ rotateX: 8, opacity: 0 }}
          animate={{ rotateX: 26, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* 안감(크림) */}
          <div style={{ position: 'absolute', inset: 9, borderRadius: 8, background: SATIN, boxShadow: 'inset 0 0 14px rgba(120,90,60,0.3)' }}>
            {/* 목걸이 걸이 슬릿 8개 */}
            <div style={{ position: 'absolute', left: 12, right: 12, top: 12, display: 'flex', justifyContent: 'space-between' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ width: 9, height: 26, borderRadius: '6px 6px 3px 3px', background: SATIN_DEEP, boxShadow: 'inset 0 2px 4px rgba(120,90,60,0.35)' }} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ready: 종이(글)를 잡고 보석함으로 끌어내림 */}
      {!stored && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDragStart={() => setOpen(true)}
          onDragEnd={onDragEnd}
          whileDrag={{ scale: 0.78, cursor: 'grabbing' }}
          style={{
            position: 'absolute',
            left: '50%',
            top: 8,
            width: 86,
            height: 104,
            marginLeft: -43,
            zIndex: 8,
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

      {/* stored: 종이→다이아몬드 morph 후 중앙에서 반짝, 빈 자리에 안착 */}
      {stored && (
        <>
          {/* 종이가 작게 말려 사라짐 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 60, width: 86, height: 104, marginLeft: -43, zIndex: 8, padding: '10px 8px', borderRadius: 4, background: 'var(--paper)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', fontFamily: 'var(--batang)', fontSize: 9, lineHeight: 1.5, color: 'var(--ink)', textAlign: 'left', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none' }}
            initial={{ y: 50, scale: 0.78, opacity: 1, rotate: 0 }}
            animate={{ y: [50, 4, -16], scale: [0.78, 0.5, 0.12], opacity: [1, 0.8, 0], rotate: [0, 10, 28], filter: ['blur(0px)', 'blur(1.2px)', 'blur(4px)'] }}
            transition={{ duration: 0.55, times: [0, 0.5, 1], ease: 'easeOut' }}
          >
            {text}
          </motion.div>

          {/* 변하는 순간 반짝 플래시 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 96, width: 140, height: 140, marginLeft: -70, marginTop: -70, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(214,232,255,0.5) 30%, rgba(214,232,255,0) 66%)', zIndex: 7, pointerEvents: 'none' }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.3, 1.7], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />

          {/* 다이아몬드: 중앙에서 ~2초 반짝인 뒤 내부 빈 자리(NEW_SLOT)로 내려가 안착 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 0, marginLeft: -48, zIndex: 7, pointerEvents: 'none' }}
            initial={{ x: 0, y: 104, scale: 0.18, opacity: 0, rotate: -16 }}
            animate={{ x: NEW_SLOT.x, y: [104, 70, 70, NEW_SLOT.y - 12, NEW_SLOT.y - 6], scale: [0.18, 1.0, 1.0, 0.34, 0.26], opacity: [0, 1, 1, 1, 1], rotate: [-16, 0, 0, 0, 0] }}
            transition={{ duration: 3.3, times: [0, 0.18, 0.7, 0.92, 1], ease: 'easeInOut' }}
          >
            <Gem />
          </motion.div>

          {/* 반짝이는 동안 작은 별빛 */}
          {[
            [50, 54],
            [60, 82],
            [40, 116],
            [64, 70],
          ].map(([lx, ty], k) => (
            <motion.span
              key={`tw${k}`}
              style={{ position: 'absolute', left: `${lx}%`, top: ty, width: 8, height: 8, marginLeft: -4, borderRadius: '50%', background: '#fff', boxShadow: '0 0 9px 2px rgba(214,232,255,0.95)', zIndex: 7, pointerEvents: 'none' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.3, 1, 0], scale: [0, 1, 0.7, 1, 0.4] }}
              transition={{ duration: 2.2, delay: 0.5 + k * 0.12, times: [0, 0.2, 0.5, 0.75, 1], ease: 'easeInOut' }}
            />
          ))}
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
