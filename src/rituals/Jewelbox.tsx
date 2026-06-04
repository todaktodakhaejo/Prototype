import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'
import { hapticJewelStore, hapticHeartbeat, stopVibration } from '../haptics'

const HEARTBEAT_DELAY_MS = 3900
const PARTICLES = 12
const DROP = 110

// 네이비 벨벳(사진 참조: 윤기 도는 깊은 네이비) / (어두운 배경) 반짝이는 크림 + 크림 새틴
const LEATHER = 'radial-gradient(125% 85% at 34% 22%, rgba(122,152,216,0.32) 0%, rgba(122,152,216,0) 52%), linear-gradient(150deg, #2b4576 0%, #1c2f57 46%, #122242 76%, #0c1830 100%)'
const CREAM_BOX = 'radial-gradient(125% 85% at 34% 22%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 52%), linear-gradient(150deg, #fffaf0 0%, #f6ecd6 46%, #ecdebf 78%, #ddccab 100%)'
const SATIN = 'linear-gradient(180deg, #f3ebdb 0%, #e6d8c2 60%, #d8c8ad 100%)'
const SATIN_DEEP = 'linear-gradient(180deg, #ece1cd 0%, #d7c6aa 100%)'
const SATIN_NIGHT = 'linear-gradient(180deg, #efe1e8 0%, #ddc8d2 100%)'
// 고급 골드 / 실버(클래스프 — 크림 상자=골드, 네이비 상자=실버)
const GOLD = 'linear-gradient(180deg, #fff0bf 0%, #ecca74 38%, #cf9f3e 70%, #a87a28 100%)'
const SILVER = 'linear-gradient(180deg, #ffffff 0%, #dde2ea 36%, #b3bcc9 70%, #8a93a3 100%)'
// 뚜껑 윗면(살짝 내려다본 면 — 머리 위 광원을 받아 정면보다 밝음)
const NAVY_TOP = 'linear-gradient(180deg, #4d6ea8 0%, #38568f 58%, #294168 100%)'
const CREAM_TOP = 'linear-gradient(180deg, #fffbf2 0%, #f5e8cf 58%, #e9d9b8 100%)'
// 벨벳 결 + 은은한 마름모 패턴(로고 아님) — 가는 빛 격자 + 결
const GRAIN =
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 19px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 19px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.06) 1px 3px)'

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

// 고급 골드 클래스프(여밈쇠) — 광택 플레이트 + 중앙 여밈선 + 못
function GoldClasp({ w = 34, h = 22, silver = false }: { w?: number; h?: number; silver?: boolean }) {
  const plate = silver ? SILVER : GOLD
  const seam = silver ? 'rgba(70,80,95,0.55)' : 'rgba(110,75,20,0.55)'
  const hi = silver ? 'rgba(255,255,255,0.9)' : 'rgba(255,248,220,0.75)'
  const stud = silver ? '#5e6878' : '#8a6a24'
  const innerSh = silver ? 'rgba(70,80,95,0.5)' : 'rgba(120,80,20,0.55)'
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 5, background: plate, boxShadow: `0 2px 5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -2px 4px ${innerSh}` }} />
      <div style={{ position: 'absolute', left: '50%', top: 4, bottom: 4, width: 2, marginLeft: -1, borderRadius: 1, background: seam, boxShadow: '1px 0 0 rgba(255,255,255,0.4)' }} />
      <div style={{ position: 'absolute', left: 5, right: 5, top: 3, height: 3, borderRadius: 2, background: hi }} />
      <div style={{ position: 'absolute', left: 4, top: '50%', width: 3, height: 3, marginTop: -1.5, borderRadius: '50%', background: stud }} />
      <div style={{ position: 'absolute', right: 4, top: '50%', width: 3, height: 3, marginTop: -1.5, borderRadius: '50%', background: stud }} />
    </div>
  )
}

// 닫힌 보석함(정면 + 살짝 보이는 윗면 + 광택/음영/여밈선/금속림/코너) — 사실적 입체감
// 부모(absolute, w178 h120)를 채우며 윗면은 위로 삐져나오게 그린다(부모 overflow:visible).
function ClosedBoxInner({ night }: { night: boolean }) {
  const boxBg = night ? CREAM_BOX : LEATHER
  const topBg = night ? CREAM_TOP : NAVY_TOP
  const metal = night ? GOLD : SILVER
  const metalSolid = night ? '#cf9f3e' : '#a9b3bf'
  const bodyShadow = night
    ? '0 22px 40px rgba(120,100,60,0.42), inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -14px 26px rgba(150,120,70,0.32)'
    : '0 22px 40px rgba(20,26,45,0.55), inset 0 2px 0 rgba(255,255,255,0.22), inset 0 -14px 26px rgba(0,0,0,0.46)'
  const corner = (s: React.CSSProperties) => (
    <div style={{ position: 'absolute', width: 16, height: 16, borderColor: metalSolid, opacity: 0.85, boxShadow: '0 0 2px rgba(0,0,0,0.3)', ...s }} />
  )
  return (
    <>
      {/* 뚜껑 윗면(두께) — 살짝 내려다본 사다리꼴(뒤가 좁음) */}
      <div style={{ position: 'absolute', left: '50%', bottom: 118, width: 178, height: 17, marginLeft: -89, clipPath: 'polygon(9% 100%, 91% 100%, 81% 0, 19% 0)', background: topBg, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: night ? 0.24 : 0.4, background: GRAIN }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.16) 100%)' }} />
      </div>
      {/* 뚜껑 앞날 금속 림(윗면과 정면 경계) */}
      <div style={{ position: 'absolute', left: '50%', bottom: 117, width: 146, height: 3, marginLeft: -73, borderRadius: 2, background: metal, opacity: 0.92, boxShadow: '0 1px 2px rgba(0,0,0,0.32)' }} />

      {/* 정면 본체 */}
      <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 178, height: 120, marginLeft: -89, borderRadius: '11px 11px 16px 16px', background: boxBg, boxShadow: bodyShadow, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: night ? 0.28 : 0.5, background: GRAIN }} />
        {/* 좌상 광택(벨벳 윤기) */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 82% at 26% 6%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 52%)' }} />
        {/* 측면·하단 비네트(둥근 입체) */}
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 20px 0 28px rgba(0,0,0,0.1), inset -26px 0 34px rgba(0,0,0,0.22), inset 0 -16px 28px rgba(0,0,0,0.3)' }} />
        {/* 상단 가장자리 하이라이트 */}
        <div style={{ position: 'absolute', left: 10, right: 10, top: 5, height: 10, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0))' }} />
        {/* 뚜껑·본체 여밈선 + 금속 트림 */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, height: 2, background: night ? 'rgba(150,120,80,0.35)' : 'rgba(0,0,0,0.4)', boxShadow: '0 1px 0 rgba(255,255,255,0.34)' }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: 39, height: 1, background: metal, opacity: 0.5 }} />
        {/* 앞 하단 코너 프로텍터 */}
        {corner({ left: 7, bottom: 7, borderLeft: `3px solid`, borderBottom: `3px solid`, borderRadius: '0 0 0 11px' })}
        {corner({ right: 7, bottom: 7, borderRight: `3px solid`, borderBottom: `3px solid`, borderRadius: '0 0 11px 0' })}
      </div>

      {/* 클래스프(여밈선 위 중앙) */}
      <div style={{ position: 'absolute', left: '50%', bottom: 69, marginLeft: -17 }}>
        <GoldClasp silver={!night} />
      </div>
    </>
  )
}

// 담는 보석 — 무색(clear) 또는 라이트골드(gold)
function Gem({ size = 96, tone = 'clear' }: { size?: number; tone?: 'clear' | 'gold' }) {
  const c =
    tone === 'gold'
      ? { table: '#fff6c8', crown: '#ffe084', girdle: '#eabb52', pavL: '#ffdc78', pavC: '#fffbe6', pavR: '#dca63f', glow: 'rgba(255,216,108,0.95)', f1: 'rgba(178,236,150,0.3)', f2: 'rgba(255,228,132,0.32)' }
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
  // 시간대와 무관하게 크림 보석함 + 골드 보석 + 골드 클래스프로 통일
  const night = true
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
      timers.current.push(window.setTimeout(finish, 8600))
    } else {
      setOpen(false)
    }
  }

  const showInside = open || stored

  return (
    <div style={{ position: 'relative', width: 240, height: 300, touchAction: 'none' }}>
      {/* 후광 (닫힌 뒤 뾰로롱) */}
      <motion.div
        style={{ position: 'absolute', left: '50%', top: '66%', width: 280, height: 280, marginLeft: -140, marginTop: -140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,250,233,0.98) 0%, rgba(255,239,190,0.6) 30%, rgba(231,201,122,0.4) 50%, rgba(231,201,122,0) 72%)', pointerEvents: 'none' }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={stored ? { opacity: [0, 0.95, 0.66, 0.96, 0.62, 0.98, 0.7, 0.5, 0], scale: [0.5, 0.78, 0.9, 1.05, 1.18, 1.34, 1.5, 1.62, 1.74] } : {}}
        transition={{ duration: 3.8, delay: 3.9, times: [0, 0.05, 0.18, 0.33, 0.48, 0.64, 0.8, 0.92, 1], ease: 'easeInOut' }}
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
              style={{ position: 'absolute', left: '50%', top: '66%', width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5, borderRadius: '50%', background: 'rgba(255,251,238,1)', boxShadow: '0 0 12px 3px rgba(255,221,150,0.95)', pointerEvents: 'none' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: [0, 1, 1, 0], scale: [0.4, 1.1, 0.9, 0.6] }}
              transition={{ duration: 2.0, delay: 4.0, times: [0, 0.25, 0.6, 1], ease: 'easeOut' }}
            />
          )
        })}

      {/* 닫힌 보석함(정면 외관) — 드래그 전 */}
      {!showInside && (
        <>
          <div style={{ position: 'absolute', left: '50%', bottom: 34, width: 174, height: 26, marginLeft: -87, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(18,16,28,0.34) 0%, rgba(18,16,28,0) 70%)', filter: 'blur(2px)', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '50%', bottom: 42, width: 178, height: 120, marginLeft: -89, zIndex: 2 }}>
            <ClosedBoxInner night={night} />
          </div>
        </>
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
            animate={closing ? { opacity: 0 } : { opacity: 1, scaleY: 1, y: 0 }}
            transition={{ duration: closing ? 0.22 : 0.35, ease: 'easeOut' }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: boxBg, boxShadow: night ? '0 22px 40px rgba(120,100,60,0.42), inset 0 2px 0 rgba(255,255,255,0.7)' : '0 22px 40px rgba(20,26,45,0.55), inset 0 2px 0 rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: night ? 0.28 : 0.5, background: GRAIN }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 26% 8%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 52%)' }} />
              <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 22px 0 30px rgba(0,0,0,0.1), inset -26px 0 34px rgba(0,0,0,0.22), inset 0 -16px 28px rgba(0,0,0,0.3)' }} />
            </div>
            <div style={{ position: 'absolute', left: 12, right: 12, top: 10, height: 96, background: innerSatin, clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)', boxShadow: 'inset 0 12px 22px rgba(120,90,60,0.45)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 32, background: 'linear-gradient(180deg, rgba(110,80,55,0.42) 0%, rgba(110,80,55,0) 100%)' }} />
              {[60, 74, 88].map((ty, i) => (
                <div key={i} style={{ position: 'absolute', left: 18 + i * 2, right: 18 + i * 2, top: ty, height: 6, borderRadius: 6, background: SATIN_DEEP, boxShadow: '0 1px 0 rgba(255,255,255,0.7), 0 -2px 3px rgba(120,90,60,0.25)' }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 10, right: 10, top: 106, height: 3, borderRadius: 2, background: night ? GOLD : SILVER, opacity: 0.85 }} />
            <div style={{ position: 'absolute', left: '50%', top: 116, marginLeft: -17 }}>
              <GoldClasp silver={!night} />
            </div>
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

          {/* 보석이 꽂힌 뒤(closing) — 원래 닫힌 상자가 드러나고 그 위로 같은 규격 뚜껑이 덮여 '원래 모습'으로 복귀 */}
          {closing && (
            <>
              <div style={{ position: 'absolute', left: '50%', bottom: 34, width: 174, height: 26, marginLeft: -87, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(18,16,28,0.34) 0%, rgba(18,16,28,0) 70%)', filter: 'blur(2px)', zIndex: 7, pointerEvents: 'none' }} />
              {/* 닫힌 상자 본체(받침) */}
              <div style={{ position: 'absolute', left: '50%', bottom: 42, width: 178, height: 120, marginLeft: -89, zIndex: 8 }}>
                <ClosedBoxInner night={night} />
              </div>
              {/* 뚜껑이 위 경첩에서 덮이며 닫힘 → 동일 규격으로 정확히 맞물림 */}
              <motion.div
                style={{ position: 'absolute', left: '50%', bottom: 42, width: 178, height: 120, marginLeft: -89, zIndex: 9, transformOrigin: '50% 0%', transformPerspective: 640 }}
                initial={{ rotateX: -94 }}
                animate={{ rotateX: 0 }}
                transition={{ duration: 0.5, ease: 'easeIn' }}
              >
                <ClosedBoxInner night={night} />
              </motion.div>
            </>
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
