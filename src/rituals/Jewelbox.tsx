import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { rotatingMessage, JEWELBOX_MESSAGES } from '../constants'
import { hapticJewelStore, hapticHeartbeat, stopVibration } from '../haptics'

const HEARTBEAT_DELAY_MS = 3900
const PARTICLES = 12
const DROP = 110

// 3D 상자 치수 (px) — 폭 / 깊이 / 받침 높이 / 뚜껑 높이
const W = 134
const D = 98
const BASE_H = 52
const LID_H = 24

// 네이비 벨벳(사진 참조: 윤기 도는 깊은 네이비) / (어두운 배경) 반짝이는 크림 + 크림 새틴
const LEATHER = 'radial-gradient(125% 90% at 32% 16%, rgba(132,162,224,0.4) 0%, rgba(132,162,224,0) 54%), linear-gradient(150deg, #2f4a7e 0%, #1d3059 46%, #122242 78%, #0b1730 100%)'
const CREAM_BOX = 'radial-gradient(125% 90% at 32% 16%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 54%), linear-gradient(150deg, #fffaf0 0%, #f6ecd6 46%, #ecdebf 78%, #ddccab 100%)'
const SATIN = 'linear-gradient(180deg, #f5eddd 0%, #e6d8c2 60%, #d4c4a8 100%)'
const SATIN_DEEP = 'linear-gradient(180deg, #ece1cd 0%, #d7c6aa 100%)'
const SATIN_NIGHT = 'linear-gradient(180deg, #f2e4ec 0%, #ddc8d2 100%)'
// 고급 골드 / 실버(클래스프 — 크림 상자=골드, 네이비 상자=실버)
const GOLD = 'linear-gradient(180deg, #fff0bf 0%, #ecca74 38%, #cf9f3e 70%, #a87a28 100%)'
const SILVER = 'linear-gradient(180deg, #ffffff 0%, #dde2ea 36%, #b3bcc9 70%, #8a93a3 100%)'
// 벨벳 결 + 은은한 마름모 패턴(로고 아님)
const GRAIN =
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 18px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, rgba(0,0,0,0.05) 1px 3px)'

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
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden style={{ display: 'block', filter: 'drop-shadow(0 3px 4px rgba(30,22,34,0.45))' }}>
      <polygon points="8,15 20,6 32,15 20,38" fill={color} />
      <polygon points="8,15 20,6 20,16" fill="#ffffff" opacity="0.6" />
      <polygon points="32,15 20,6 20,16" fill="#ffffff" opacity="0.3" />
      <polygon points="8,15 20,16 20,38" fill="#ffffff" opacity="0.2" />
      <polygon points="32,15 20,16 20,38" fill="#2a1f2a" opacity="0.12" />
    </svg>
  )
}

// 고급 골드/실버 클래스프(여밈쇠) — 광택 플레이트 + 중앙 여밈선 + 못
function Clasp({ w = 34, h = 20, silver = false }: { w?: number; h?: number; silver?: boolean }) {
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

// 담는 보석 — 무색(clear) 또는 라이트골드(gold)
function Gem({ size = 88, tone = 'clear' }: { size?: number; tone?: 'clear' | 'gold' }) {
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

// 보석함 안에 이미 담긴 보석들이 놓이는 자리(화면 top px·중앙 기준 x) — 입체 입구 안쪽에 타원으로
const SLOTS = [
  { x: -46, y: 150, s: 22 },
  { x: -16, y: 158, s: 27 },
  { x: 17, y: 158, s: 27 },
  { x: 46, y: 150, s: 22 },
]
const NEW_SEAT_Y = 150 // 새 보석이 꽂히는 중앙 자리(센터 기준 화면 top px)

export default function Jewelbox({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('jewelbox', JEWELBOX_MESSAGES))
  // 어두운/노을 배경(밤·새벽·노을) → 크림 보석함 + 골드 보석 / 그 외(일출·낮) → 네이비 벨벳 + 화이트 다이아 + 실버 클래스프
  const tod = useTimeOfDay()
  const night = tod === 'night' || tod === 'pre-dawn' || tod === 'dusk'
  const [stored, setStored] = useState(false)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false) // 뚜껑이 닫히기 시작
  const [storedColors] = useState(() => pickPastels(4, night))
  const fired = useRef(false)
  const doneRef = useRef(false)
  const timers = useRef<number[]>([])

  const boxBg = night ? CREAM_BOX : LEATHER
  const innerSatin = night ? SATIN_NIGHT : SATIN
  const gemTone: 'clear' | 'gold' = night ? 'gold' : 'clear'
  const pipe = night ? 'inset 0 0 0 2px rgba(212,176,96,0.85)' : 'inset 0 0 0 2px rgba(200,210,222,0.9)'

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
      timers.current.push(window.setTimeout(() => setClosing(true), 3300))
      timers.current.push(window.setTimeout(hapticJewelStore, 3550))
      timers.current.push(window.setTimeout(hapticHeartbeat, HEARTBEAT_DELAY_MS))
      timers.current.push(window.setTimeout(finish, 8600))
    } else {
      setOpen(false)
    }
  }

  const showInside = open || stored
  // 뚜껑 각도: 닫힘 0 / 열림 -112 / 닫히는 중 0 (경첩이 뒤로 젖혀졌다가 덮임)
  const lidAngle = !showInside || closing ? 0 : -112
  const gemsVisible = !closing // 닫힐 때 보석은 상자 안으로 봉인되며 사라짐

  // ── 면(face) 공통 스타일 헬퍼 ──
  const face = (w: number, h: number, transform: string): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: w,
    height: h,
    marginLeft: -w / 2,
    marginTop: -h / 2,
    transform,
    transformStyle: 'preserve-3d',
    overflow: 'hidden',
  })
  const grainOpacity = night ? 0.32 : 0.5

  return (
    <div style={{ position: 'relative', width: 240, height: 300, touchAction: 'none' }}>
      {/* 후광 (닫힌 뒤 뾰로롱) */}
      <motion.div
        style={{ position: 'absolute', left: '50%', top: '52%', width: 280, height: 280, marginLeft: -140, marginTop: -140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,250,233,0.98) 0%, rgba(255,239,190,0.6) 30%, rgba(231,201,122,0.4) 50%, rgba(231,201,122,0) 72%)', pointerEvents: 'none', zIndex: 12 }}
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
              style={{ position: 'absolute', left: '50%', top: '52%', width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5, borderRadius: '50%', background: 'rgba(255,251,238,1)', boxShadow: '0 0 12px 3px rgba(255,221,150,0.95)', pointerEvents: 'none', zIndex: 12 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: [0, 1, 1, 0], scale: [0.4, 1.1, 0.9, 0.6] }}
              transition={{ duration: 2.0, delay: 4.0, times: [0, 0.25, 0.6, 1], ease: 'easeOut' }}
            />
          )
        })}

      {/* ───────── 3D 보석함 (입체 받침 + 경첩 뚜껑) ───────── */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 64, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 820, perspectiveOrigin: '50% 34%' }}>
        {/* 바닥 접지 그림자 */}
        <div style={{ position: 'absolute', bottom: 6, left: '50%', width: 176, height: 38, marginLeft: -88, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(20,18,30,0.34) 0%, rgba(20,18,30,0) 70%)', filter: 'blur(2px)' }} />

        <div style={{ position: 'relative', width: W, height: BASE_H + LID_H + 8, transformStyle: 'preserve-3d', transform: 'rotateX(15deg) rotateY(-26deg)' }}>
          {/* ── 받침(tray): 벽 4면 + 새틴 바닥 ── */}
          {/* 바닥(새틴 내부) */}
          <div style={{ ...face(W - 10, D - 10, `rotateX(90deg) translateZ(${-BASE_H / 2}px)`), background: innerSatin, boxShadow: 'inset 0 0 22px rgba(120,90,60,0.4)' }}>
            {/* 보석 받침 리지 */}
            {[0.34, 0.5, 0.66].map((p, i) => (
              <div key={i} style={{ position: 'absolute', left: '14%', right: '14%', top: `${p * 100}%`, height: 5, borderRadius: 5, background: SATIN_DEEP, boxShadow: '0 1px 0 rgba(255,255,255,0.7), 0 -2px 3px rgba(120,90,60,0.25)' }} />
            ))}
          </div>
          {/* 뒷벽(내부) */}
          <div style={{ ...face(W, BASE_H, `rotateY(180deg) translateZ(${D / 2}px)`), background: boxBg, backgroundColor: night ? '#ecdec0' : '#13233f' }}>
            <div style={{ position: 'absolute', inset: 0, background: GRAIN, opacity: grainOpacity }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.32), rgba(0,0,0,0.12))' }} />
          </div>
          {/* 좌벽 */}
          <div style={{ ...face(D, BASE_H, `rotateY(-90deg) translateZ(${W / 2}px)`), background: boxBg, backgroundColor: night ? '#e6d6b6' : '#11203b' }}>
            <div style={{ position: 'absolute', inset: 0, background: GRAIN, opacity: grainOpacity }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
          </div>
          {/* 우벽 */}
          <div style={{ ...face(D, BASE_H, `rotateY(90deg) translateZ(${W / 2}px)`), background: boxBg, backgroundColor: night ? '#e6d6b6' : '#11203b' }}>
            <div style={{ position: 'absolute', inset: 0, background: GRAIN, opacity: grainOpacity }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.34)' }} />
          </div>
          {/* 앞벽(정면 외관) */}
          <div style={{ ...face(W, BASE_H, `translateZ(${D / 2}px)`), background: boxBg, backgroundColor: night ? '#f1e3c6' : '#1a2c50', boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.28)' }}>
            <div style={{ position: 'absolute', inset: 0, background: GRAIN, opacity: grainOpacity }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.16) 100%)' }} />
            {/* 금속 테두리 라인 */}
            <div style={{ position: 'absolute', left: 8, right: 8, top: 6, height: 2, borderRadius: 2, background: night ? GOLD : SILVER, opacity: 0.8 }} />
          </div>

          {/* ── 경첩 뚜껑: 뒤쪽 위 모서리를 축으로 여닫음 ── */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translateY(${-BASE_H / 2}px) translateZ(${-D / 2}px)` }}>
            <motion.div
              style={{ position: 'absolute', transformStyle: 'preserve-3d', transformOrigin: '0px 0px 0px' }}
              initial={false}
              animate={{ rotateX: lidAngle }}
              transition={{ duration: closing ? 0.52 : 0.5, ease: closing ? 'easeIn' : [0.34, 1.2, 0.5, 1] }}
            >
              {/* 슬랩(뚜껑 두께) — 경첩에서 앞·위로 오프셋 */}
              <div style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translateZ(${D / 2}px) translateY(${-LID_H / 2}px)` }}>
                {/* 뚜껑 윗면 */}
                <div style={{ ...face(W, D, `rotateX(90deg) translateZ(${LID_H / 2}px)`), background: boxBg, backgroundColor: night ? '#fbf2db' : '#23386180', boxShadow: pipe }}>
                  <div style={{ position: 'absolute', inset: 0, background: GRAIN, opacity: grainOpacity }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 52%)' }} />
                  {/* 가운데 은은한 자수 마름모 */}
                  <div style={{ position: 'absolute', left: '50%', top: '50%', width: 30, height: 30, marginLeft: -15, marginTop: -15, transform: 'rotate(45deg)', border: `1px solid ${night ? 'rgba(207,159,62,0.4)' : 'rgba(200,210,222,0.4)'}`, borderRadius: 4 }} />
                </div>
                {/* 뚜껑 앞 립 + 클래스프 */}
                <div style={{ ...face(W, LID_H, `translateZ(${D / 2}px)`), background: boxBg, backgroundColor: night ? '#f3e5c8' : '#1c2e52' }}>
                  <div style={{ position: 'absolute', inset: 0, background: GRAIN, opacity: grainOpacity }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.14))' }} />
                  <div style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -17, marginTop: -10 }}>
                    <Clasp silver={!night} />
                  </div>
                </div>
                {/* 뚜껑 좌/우 립 */}
                <div style={{ ...face(D, LID_H, `rotateY(-90deg) translateZ(${W / 2}px)`), background: boxBg, backgroundColor: night ? '#ecdcbb' : '#16264400' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.26)' }} />
                </div>
                <div style={{ ...face(D, LID_H, `rotateY(90deg) translateZ(${W / 2}px)`), background: boxBg, backgroundColor: night ? '#ecdcbb' : '#162644' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 이미 담긴 파스텔 보석들(입구 안쪽) — 닫힐 때 봉인되며 사라짐 */}
      {showInside &&
        storedColors.map((c, i) => (
          <motion.div
            key={`stored${i}`}
            style={{ position: 'absolute', left: '50%', top: SLOTS[i].y, marginLeft: SLOTS[i].x - SLOTS[i].s / 2, zIndex: 5, pointerEvents: 'none' }}
            initial={{ opacity: 0, scale: 0.5, y: 6 }}
            animate={{ opacity: gemsVisible ? 1 : 0, scale: 1, y: 0 }}
            transition={{ duration: gemsVisible ? 0.4 : 0.22, delay: gemsVisible ? 0.12 + i * 0.06 : 0, ease: 'easeOut' }}
          >
            <MiniGem color={c} size={SLOTS[i].s} />
          </motion.div>
        ))}

      {/* ready: 종이를 잡고 보석함으로 끌어내림 */}
      {!stored && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDragStart={() => setOpen(true)}
          onDragEnd={onDragEnd}
          whileDrag={{ scale: 0.78, cursor: 'grabbing' }}
          style={{ position: 'absolute', left: '50%', top: 6, width: 86, height: 104, marginLeft: -43, zIndex: 8, padding: '10px 8px', borderRadius: 4, background: 'var(--paper)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', fontFamily: 'var(--batang)', fontSize: 9, lineHeight: 1.5, color: 'var(--ink)', textAlign: 'left', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'grab', touchAction: 'none' }}
        >
          {text}
        </motion.div>
      )}

      {/* stored: 종이→보석 → 중앙 반짝 → 빈자리에 꾹 꽂힘 → (닫힘 시 봉인) */}
      {stored && (
        <>
          {/* 종이가 작게 말려 사라짐 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 40, width: 86, height: 104, marginLeft: -43, zIndex: 8, padding: '10px 8px', borderRadius: 4, background: 'var(--paper)', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', fontFamily: 'var(--batang)', fontSize: 9, lineHeight: 1.5, color: 'var(--ink)', textAlign: 'left', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none' }}
            initial={{ y: 40, scale: 0.78, opacity: 1, rotate: 0 }}
            animate={{ y: [40, 4, -10], scale: [0.78, 0.5, 0.12], opacity: [1, 0.8, 0], rotate: [0, 10, 28], filter: ['blur(0px)', 'blur(1.2px)', 'blur(4px)'] }}
            transition={{ duration: 0.55, times: [0, 0.5, 1], ease: 'easeOut' }}
          >
            {text}
          </motion.div>

          {/* 변하는 순간 반짝 플래시(중앙) */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 92, width: 140, height: 140, marginLeft: -70, marginTop: -70, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(214,232,255,0.5) 30%, rgba(214,232,255,0) 66%)', zIndex: 7, pointerEvents: 'none' }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.3, 1.7], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          />

          {/* 보석: 중앙에서 ~2초 반짝 → 빈자리로 내려가 안착(균일 스케일) → 닫힘 시 봉인 페이드 */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: 0, marginLeft: -44, zIndex: 7, pointerEvents: 'none' }}
            animate={{ opacity: gemsVisible ? 1 : 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              initial={{ y: 56, scale: 0.18, opacity: 0, rotate: -16 }}
              animate={{
                y: [56, 40, 40, NEW_SEAT_Y - 44 + 8, NEW_SEAT_Y - 44 - 2, NEW_SEAT_Y - 44],
                scale: [0.18, 1.0, 1.0, 0.82, 0.8, 0.81],
                opacity: [0, 1, 1, 1, 1, 1],
                rotate: [-16, 0, 0, 0, 0, 0],
              }}
              transition={{ duration: 3.1, times: [0, 0.16, 0.66, 0.86, 0.93, 1], ease: 'easeInOut' }}
            >
              <Gem tone={gemTone} />
            </motion.div>
          </motion.div>

          {/* 꽂히는 순간 자리 반짝(seat flash) */}
          <motion.div
            style={{ position: 'absolute', left: '50%', top: NEW_SEAT_Y + 6, width: 80, height: 80, marginLeft: -40, marginTop: -40, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,236,190,0.42) 40%, rgba(255,236,190,0) 70%)', zIndex: 6, pointerEvents: 'none' }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.1, 1.6], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.5, delay: 2.7, ease: 'easeOut' }}
          />

          {/* 반짝이는 동안 작은 별빛 */}
          {[
            [50, 50],
            [60, 78],
            [40, 112],
            [64, 66],
          ].map(([lx, ty], k) => (
            <motion.span
              key={`tw${k}`}
              style={{ position: 'absolute', left: `${lx}%`, top: ty, width: 8, height: 8, marginLeft: -4, borderRadius: '50%', background: '#fff', boxShadow: '0 0 9px 2px rgba(214,232,255,0.95)', zIndex: 7, pointerEvents: 'none' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.3, 1, 0], scale: [0, 1, 0.7, 1, 0.4] }}
              transition={{ duration: 2.2, delay: 0.5 + k * 0.12, times: [0, 0.2, 0.5, 0.75, 1], ease: 'easeInOut' }}
            />
          ))}

          {/* 뾰로롱 — 닫히는 순간 작은 별 스파클 팝 */}
          {[
            [30, 110],
            [70, 108],
            [50, 86],
            [22, 140],
            [78, 140],
          ].map(([lx, ty], k) => (
            <motion.span
              key={`pop${k}`}
              style={{ position: 'absolute', left: `${lx}%`, top: ty, width: 10, height: 10, marginLeft: -5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px 3px rgba(255,236,190,0.95)', zIndex: 12, pointerEvents: 'none' }}
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
