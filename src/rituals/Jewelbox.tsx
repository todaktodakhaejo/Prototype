import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'
import { hapticJewelStore, hapticHeartbeat, stopVibration } from '../haptics'

const HEARTBEAT_DELAY_MS = 3900
const PARTICLES = 12
const DROP = 110

// 네이비 가죽 / (밤) 반짝이는 크림 + 크림 새틴
const LEATHER = 'linear-gradient(150deg, #45557a 0%, #303c5c 48%, #222c47 78%, #1a2238 100%)'
const CREAM_BOX = 'linear-gradient(150deg, #fffaf0 0%, #f6ecd6 46%, #ecdebf 78%, #ddccab 100%)'
const SATIN = 'linear-gradient(180deg, #f3ebdb 0%, #e6d8c2 60%, #d8c8ad 100%)'
const SATIN_DEEP = 'linear-gradient(180deg, #ece1cd 0%, #d7c6aa 100%)'
const SATIN_NIGHT = 'linear-gradient(180deg, #efe1e8 0%, #ddc8d2 100%)' // 크림 상자 대비용(연한 모브)
const GOLD = 'linear-gradient(180deg, #fbe9b0 0%, #d9b25e 55%, #b88e3c 100%)'
const GRAIN = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0.05) 2px 5px)'

// 파스텔(아무거나) / 밤엔 노랑·금빛 제외(라이트골드 새 보석이 묻히지 않게)
const PASTELS = ['#f7c5d6', '#d3c0f2', '#bfe3e8', '#d9edc2', '#f7e3a6', '#f4cbb6', '#cdd9f6', '#ecc6e6']
const PASTELS_COOL = ['#f7c5d6', '#d3c0f2', '#bfe3e8', '#d9edc2', '#cdd9f6', '#ecc6e6']
function pickPastels(n: number, cool: boolean): string[] {
  const a = [...(cool ? PASTELS_COOL : PASTELS)]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

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

// 담는 보석 — 무색(clear) 또는 라이트골드(gold)
function Gem({ size = 96, tone = 'clear' }: { size?: number; tone?: 'clear' | 'gold' }) {
  const c =
    tone === 'gold'
      ? { table: '#ffe49a', crown: '#f0c860', girdle: '#cf9f3e', pavL: '#e6bd5c', pavC: '#fff0b0', pavR: '#b9882c', glow: 'rgba(255,196,70,0.95)', f1: 'rgba(255,180,70,0.3)', f2: 'rgba(255,150,40,0.25)' }
      : { table: '#eef5fd', crown: '#cfe0f1', girdle: '#bcd3ea', pavL: '#b6cde6', pavC: '#e3effb', pavR: '#a6c1df', glow: 'rgba(190,225,255,0.85)', f1: 'rgba(120,210,180,0.22)', f2: 'rgba(180,150,230,0.22)' }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ filter: `drop-shadow(0 0 10px ${c.glow})` }}>
      <polygon points="36,12 64,12 74,38 26,38" fill={c.table} />
      <polygon points="8,38 26,38 36,12" fill={c.crown} />
      <polygon points="92,38 74,38 64,12" fill={c.crown} />
      <polygon points="40,15 60,15 56,30 44,30" fill="rgba(255,255,255,0.92)" />
      <rect x="8" y="37" width="84" height="2.2" fill={c.girdle} />
      <polygon points="8,39 41,39 50,96" fill={c.pavL} />
      <polygon points="41,39 59,39 50,96" fill={c.pavC} />
      <polygon points="59,39 92,39 50,96" fill={c.pavR} />
      <polygon points="20,39 33,39 50,96" fill={c.f1} />
      <polygon points="67,39 80,39 50,96" fill={c.f2} />
      <polygon points="41,39 59,39 54,60 46,60" fill="rgba(255,255,255,0.7)" />
      <polygon points="26,38 36,38 30,54" fill="rgba(255,255,255,0.45)" />
      <g fill="#ffffff">
        <path d="M71 19 l2.2 6.2 6.2 2.2 -6.2 2.2 -2.2 6.2 -2.2 -6.2 -6.2 -2.2 6.2 -2.2 z" opacity="0.95" />
        <path d="M33 29 l1.5 4.2 4.2 1.5 -4.2 1.5 -1.5 4.2 -1.5 -4.2 -4.2 -1.5 4.2 -1.5 z" opacity="0.8" />
      </g>
    </svg>
  )
}

const SLOTS = [
  { x: -58, y: 206 },
  { x: -30, y: 214 },
  { x: 30, y: 214 },
  { x: 58, y: 206 },
]
const NEW_SEAT_Y = 188 // 새 보석이 꽂히는 중앙 자리(센터 기준 화면 top px)

export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  const night = useTimeOfDay() === 'night'
  const [stored, setStored] = useState(false)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false) // 뚜껑이 닫히기 시작(열린-뚜껑·내부 정리)
  const [storedColors] = useState(() => pickPastels(4, night))
  const fired = useRef(false)
  const doneRef = useRef(false)
  const timers = useRef<number[]>([])

  const boxBg = night ? CREAM_BOX : LEATHER
  const innerSatin = night ? SATIN_NIGHT : SATIN
  const gemTone: 'clear' | 'gold' = night ? 'gold' : 'clear'

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
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
      hapticJewelStore() // 담기 시작
      // 뚜껑 닫히기 시작(열린 뚜껑·내부 정리) → 닫히며 후광 뾰로롱 + 진동
      timers.current.push(window.setTimeout(() => setClosing(true), 3300))
      timers.current.push(window.setTimeout(hapticJewelStore, 3550))
      timers.current.push(window.setTimeout(hapticHeartbeat, HEARTBEAT_DELAY_MS))
      timers.current.push(window.setTimeout(finish, 7400))
    } else {
      setOpen(false)
    }
  }

  const showInside = open || stored

  return (
    <div style={{ position: 'relative', width: 240, height: 300, touchAction: 'none' }}>
      {/* 후광 (닫힌 뒤 뾰로롱) */}
      <motion.div
        style={{ position: 'absolute', left: '50%', top: '66%', width: 230, height: 230, marginLeft: -115, marginTop: -115, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,247,224,0.9) 0%, rgba(231,201,122,0.34) 42%, rgba(231,201,122,0) 70%)', pointerEvents: 'none' }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={stored ? { opacity: [0, 0.66, 0.4, 0.66, 0.4, 0.66, 0.24, 0], scale: [0.5, 0.72, 0.82, 0.95, 1.05, 1.2, 1.32, 1.45] } : {}}
        transition={{ duration: 2.6, delay: 3.9, times: [0, 0.05, 0.2, 0.38, 0.55, 0.75, 0.9, 1], ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (stored) finish()
        }}
      />

      {/* 빛 입자 (뾰로롱) */}
      {stored &&
        Array.from({ length: PARTICLES }).map((_, i) => {
          const angle = (i / PARTICLES) * Math.PI * 2
          const dist = 92 + (i % 3) * 16
          return (
            <motion.span
              key={i}
              style={{ position: 'absolute', left: '50%', top: '66%', width: 6, height: 6, marginLeft: -3, marginTop: -3, borderRadius: '50%', background: 'rgba(255,250,235,0.95)', boxShadow: '0 0 9px 2px rgba(231,201,122,0.8)', pointerEvents: 'none' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
              transition={{ duration: 1.4, delay: 4.0, ease: 'easeOut' }}
            />
          )
        })}

      {/* 닫힌 보석함(정면 외관) — 드래그 전 */}
      {!showInside && (
        <div style={{ position: 'absolute', left: '50%', bottom: 42, width: 178, height: 120, marginLeft: -89, zIndex: 2, borderRadius: 14, background: boxBg, boxShadow: night ? '0 22px 40px rgba(120,100,60,0.4), inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -12px 24px rgba(150,120,70,0.3)' : '0 22px 40px rgba(20,26,45,0.5), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.42)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: night ? 0.28 : 0.5, background: GRAIN }} />
          <div style={{ position: 'absolute', left: 10, right: 10, top: 6, height: 12, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 42, height: 2, background: night ? 'rgba(150,120,80,0.3)' : 'rgba(0,0,0,0.3)', boxShadow: '0 1px 0 rgba(255,255,255,0.3)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 36, width: 30, height: 20, marginLeft: -15, borderRadius: 4, background: GOLD, boxShadow: '0 2px 5px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)' }} />
        </div>
      )}

      {/* 열린 보석함(위에서 내려다본 내부) */}
      {showInside && (
        <>
          {/* 뒤로 기대 선 뚜껑 — 닫히기 시작하면 감춤(원래 닫힌 모양으로) */}
          {!closing && (
            <div style={{ position: 'absolute', left: '50%', bottom: 156, width: 196, height: 80, marginLeft: -98, zIndex: 1, transformOrigin: '50% 100%', transform: 'perspective(560px) rotateX(34deg)', borderRadius: '12px 12px 4px 4px', background: boxBg, boxShadow: '0 -8px 18px rgba(20,26,45,0.4), inset 0 2px 0 rgba(255,255,255,0.16)', padding: 8 }}>
              <div style={{ position: 'absolute', inset: 8, borderRadius: 8, background: innerSatin, boxShadow: 'inset 0 0 14px rgba(120,90,60,0.3)' }}>
                <div style={{ position: 'absolute', left: 12, right: 12, top: 12, display: 'flex', justifyContent: 'space-between' }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ width: 9, height: 24, borderRadius: '6px 6px 3px 3px', background: SATIN_DEEP, boxShadow: 'inset 0 2px 4px rgba(120,90,60,0.35)' }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 가죽/크림 본체 + 새틴 내부 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', bottom: 28, width: 206, height: 140, marginLeft: -103, zIndex: 2 }}
            initial={{ opacity: 0, scaleY: 0.82, y: 8 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: boxBg, boxShadow: night ? '0 22px 40px rgba(120,100,60,0.4), inset 0 2px 0 rgba(255,255,255,0.7)' : '0 22px 40px rgba(20,26,45,0.5), inset 0 2px 0 rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: night ? 0.28 : 0.5, background: GRAIN }} />
            </div>
            <div style={{ position: 'absolute', left: 12, right: 12, top: 10, height: 96, background: innerSatin, clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)', boxShadow: 'inset 0 12px 22px rgba(120,90,60,0.45)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 32, background: 'linear-gradient(180deg, rgba(110,80,55,0.42) 0%, rgba(110,80,55,0) 100%)' }} />
              {[60, 74, 88].map((ty, i) => (
                <div key={i} style={{ position: 'absolute', left: 18 + i * 2, right: 18 + i * 2, top: ty, height: 6, borderRadius: 6, background: SATIN_DEEP, boxShadow: '0 1px 0 rgba(255,255,255,0.7), 0 -2px 3px rgba(120,90,60,0.25)' }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 10, right: 10, top: 106, height: 3, borderRadius: 2, background: GOLD, opacity: 0.85 }} />
            <div style={{ position: 'absolute', left: '50%', top: 118, width: 30, height: 18, marginLeft: -15, borderRadius: 4, background: GOLD, boxShadow: '0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)' }} />
          </motion.div>

          {/* 이미 담긴 파스텔 보석들 */}
          {storedColors.map((c, i) => (
            <motion.div
              key={`stored${i}`}
              style={{ position: 'absolute', left: '50%', top: SLOTS[i].y, marginLeft: SLOTS[i].x - 12, zIndex: 4, pointerEvents: 'none' }}
              initial={{ opacity: 0, scale: 0.5, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 + i * 0.06, ease: 'easeOut' }}
            >
              <MiniGem color={c} size={i === 0 || i === 3 ? 22 : 26} />
            </motion.div>
          ))}
        </>
      )}

      {/* ready: 종이를 잡고 보석함으로 끌어내림 */}
      {!stored && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDragStart={() => setOpen(true)}
          onDragEnd={onDragEnd}
          whileDrag={{ scale: 0.78, cursor: 'grabbing' }}
          style={{ position: 'absolute', left: '50%', top: 8, width: 86, height: 104, marginLeft: -43, zIndex: 8, padding: '10px 8px', borderRadius: 4, background: 'var(--paper)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', fontFamily: 'var(--batang)', fontSize: 9, lineHeight: 1.5, color: 'var(--ink)', textAlign: 'left', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'grab', touchAction: 'none' }}
        >
          {text}
        </motion.div>
      )}

      {/* stored: 종이→보석 → 중앙 반짝 → 빈자리에 꾹 꽂힘 → 뚜껑 닫힘 */}
      {stored && (
        <>
          {/* 종이가 작게 말려 사라짐 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 48, width: 86, height: 104, marginLeft: -43, zIndex: 8, padding: '10px 8px', borderRadius: 4, background: 'var(--paper)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', fontFamily: 'var(--batang)', fontSize: 9, lineHeight: 1.5, color: 'var(--ink)', textAlign: 'left', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none' }}
            initial={{ y: 50, scale: 0.78, opacity: 1, rotate: 0 }}
            animate={{ y: [50, 4, -16], scale: [0.78, 0.5, 0.12], opacity: [1, 0.8, 0], rotate: [0, 10, 28], filter: ['blur(0px)', 'blur(1.2px)', 'blur(4px)'] }}
            transition={{ duration: 0.55, times: [0, 0.5, 1], ease: 'easeOut' }}
          >
            {text}
          </motion.div>

          {/* 변하는 순간 반짝 플래시(중앙) */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 96, width: 140, height: 140, marginLeft: -70, marginTop: -70, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(214,232,255,0.5) 30%, rgba(214,232,255,0) 66%)', zIndex: 7, pointerEvents: 'none' }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.3, 1.7], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />

          {/* 보석: 중앙에서 ~2초 반짝 → 빈자리로 내려가 '꾹 꽂히고'(스쿼시) 반동으로 안착 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 0, marginLeft: -48, zIndex: 7, pointerEvents: 'none' }}
            initial={{ y: 60, scale: 0.18, opacity: 0, rotate: -16 }}
            // 납작해지지 않게 균일 스케일 유지. 가볍게 내려앉는 정도(작은 바운스)만.
            animate={{
              y: [60, 44, 44, NEW_SEAT_Y - 48 + 8, NEW_SEAT_Y - 48 - 2, NEW_SEAT_Y - 48],
              scale: [0.18, 1.0, 1.0, 0.79, 0.77, 0.78],
              opacity: [0, 1, 1, 1, 1, 1],
              rotate: [-16, 0, 0, 0, 0, 0],
            }}
            transition={{ duration: 3.3, times: [0, 0.16, 0.66, 0.86, 0.93, 1], ease: 'easeInOut' }}
          >
            <Gem tone={gemTone} />
          </motion.div>

          {/* 꽂히는 순간 자리 반짝(seat flash) */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: NEW_SEAT_Y + 8, width: 80, height: 80, marginLeft: -40, marginTop: -40, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,236,190,0.42) 40%, rgba(255,236,190,0) 70%)', zIndex: 6, pointerEvents: 'none' }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.1, 1.6], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.5, delay: 2.85, ease: 'easeOut' }}
          />

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

          {/* 보석이 꽂힌 뒤(closing) 뚜껑이 닫힘 — 그 전엔 렌더하지 않아 보석을 가리지 않음 */}
          {closing && (
          <motion.div
            style={{ position: 'absolute', left: '50%', bottom: 42, width: 204, height: 118, marginLeft: -102, zIndex: 9, transformOrigin: '50% 0%', transformPerspective: 620, borderRadius: '14px 14px 8px 8px', background: boxBg, boxShadow: '0 14px 26px rgba(20,26,45,0.4), inset 0 2px 0 rgba(255,255,255,0.4)', overflow: 'hidden' }}
            initial={{ rotateX: -92 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: night ? 0.26 : 0.5, background: GRAIN }} />
            <div style={{ position: 'absolute', left: 10, right: 10, top: 8, height: 12, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))' }} />
            <div style={{ position: 'absolute', left: '50%', bottom: 8, width: 30, height: 18, marginLeft: -15, borderRadius: 4, background: GOLD, boxShadow: '0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.6)' }} />
          </motion.div>
          )}

          {/* 뾰로롱 — 닫히는 순간 작은 별 스파클 팝 */}
          {[
            [30, 120],
            [70, 118],
            [50, 96],
            [22, 150],
            [78, 150],
          ].map(([lx, ty], k) => (
            <motion.span
              key={`pop${k}`}
              style={{ position: 'absolute', left: `${lx}%`, top: ty, width: 10, height: 10, marginLeft: -5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px 3px rgba(255,236,190,0.95)', zIndex: 10, pointerEvents: 'none' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0.4] }}
              transition={{ duration: 0.7, delay: 3.7 + k * 0.08, ease: 'easeOut' }}
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

      {/* 마무리 멘트 — 상단(보석함과 겹치지 않게) */}
      {stored && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, top: -42, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, whiteSpace: 'pre-line', pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4.2 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
