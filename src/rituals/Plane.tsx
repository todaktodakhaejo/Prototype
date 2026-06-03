import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import Gauge from './Gauge'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { rotatingMessage, PLANE_MESSAGES } from '../constants'
import { hapticTension, hapticLaunch, stopVibration } from '../haptics'

const PULL_HAPTIC_PX = 12 // 당기는 긴장감 진동 1펄스당 당김 변화량(px)

const MOTES = 6
const MAXPULL = 170 // 이만큼 당기면 파워 100%

// 다 날아간 자리에 별빛으로 반짝 — 사방으로 빛줄기가 뻗는 별(레퍼런스)
function Star({ glow, offsetX, offsetY }: { glow: string; offsetX: number; offsetY: number }) {
  const rays = 12
  return (
    <motion.div
      // 비행기 도착 지점(화면 중앙 기준 dir*flyDist)에 별이 뜬다
      style={{ position: 'absolute', left: '50%', top: '50%', width: 120, height: 120, marginLeft: offsetX - 60, marginTop: offsetY - 60, pointerEvents: 'none', zIndex: 8 }}
      initial={{ scale: 0.2, opacity: 0, rotate: -8 }}
      animate={{ scale: [0.2, 1.15, 1, 1.04, 0.9], opacity: [0, 1, 1, 1, 0], rotate: [-8, 0, 2, 3, 6] }}
      transition={{ duration: 1.8, times: [0, 0.18, 0.45, 0.75, 1], ease: 'easeOut' }}
    >
      {/* 부드러운 글로우 */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, rgba(255,255,255,0.12) 26%, rgba(255,255,255,0) 60%)` }} />
      {/* 빛줄기(레이) — 길고 짧은 게 번갈아 */}
      {Array.from({ length: rays }).map((_, i) => {
        const ang = (360 / rays) * i
        const long = i % 2 === 0
        const h = long ? 108 : 54
        const w = long ? 2.5 : 1.5
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: w,
              height: h,
              marginLeft: -w / 2,
              marginTop: -h / 2,
              transformOrigin: '50% 50%',
              transform: `rotate(${ang}deg)`,
              background: `linear-gradient(0deg, rgba(255,255,255,0) 0%, ${glow} 42%, #ffffff 50%, ${glow} 58%, rgba(255,255,255,0) 100%)`,
              filter: 'blur(0.6px)',
              opacity: long ? 0.95 : 0.6,
            }}
          />
        )
      })}
      {/* 밝은 코어 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 14,
          height: 14,
          marginLeft: -7,
          marginTop: -7,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, #ffffff 30%, rgba(255,255,255,0) 72%)',
          boxShadow: `0 0 12px 4px ${glow}`,
        }}
      />
    </motion.div>
  )
}

// 분사한 연료가 모여 만들어진 구름 — 여러 겹 블롭 + 블러로 적당히 사실적인 뭉게구름
type Puff = { x: number; y: number; r: number }
// 구름 실루엣 변형 3종(획일적이지 않게) — 넓고 납작 / 둥글고 도톰 / 작고 흩어진
const PUFFS_A: Puff[] = [
  { x: 36, y: 60, r: 54 },
  { x: 74, y: 38, r: 78 },
  { x: 118, y: 40, r: 62 },
  { x: 152, y: 58, r: 46 },
  { x: 56, y: 64, r: 48 },
  { x: 100, y: 64, r: 50 },
  { x: 136, y: 62, r: 44 },
  { x: 92, y: 26, r: 50 },
]
const PUFFS_B: Puff[] = [
  { x: 52, y: 52, r: 66 },
  { x: 98, y: 36, r: 86 },
  { x: 142, y: 54, r: 56 },
  { x: 74, y: 64, r: 52 },
  { x: 120, y: 66, r: 52 },
]
const PUFFS_C: Puff[] = [
  { x: 40, y: 48, r: 40 },
  { x: 76, y: 40, r: 60 },
  { x: 110, y: 50, r: 44 },
  { x: 62, y: 60, r: 38 },
  { x: 98, y: 58, r: 42 },
  { x: 132, y: 56, r: 30 },
]

function Cloud({ left, top, scale, opacity, delay, drift, puffs }: { left: string; top: string; scale: number; opacity: number; delay: number; drift: number; puffs: Puff[] }) {
  return (
    <motion.div
      style={{ position: 'absolute', left, top, width: 196, height: 96, marginLeft: -98, marginTop: -48, pointerEvents: 'none', zIndex: 7, filter: 'blur(2.6px)' }}
      initial={{ opacity: 0, x: -drift, scale }}
      animate={{ opacity: [0, opacity, opacity], x: [-drift, 0, drift], scale }}
      transition={{ duration: 2.6, delay, times: [0, 0.4, 1], ease: 'easeOut' }}
    >
      {puffs.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.r,
            height: p.r * 0.92,
            marginLeft: -p.r / 2,
            marginTop: -(p.r * 0.92) / 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 38%, #ffffff 0%, #f4f6fb 52%, rgba(244,246,251,0.5) 74%, rgba(244,246,251,0) 90%)',
          }}
        />
      ))}
    </motion.div>
  )
}

// 하늘에 고루 흩어 떠 있는 구름들 — 중앙(별빛 자리)은 비우고 상/중(모서리)/하로 분산
// 좌표를 의식 컨테이너 밖(음수~100% 초과)까지 넓혀 화면 전체(엔딩멘트 아래까지)로 흩뿌림.
//  위쪽은 작게, 아래쪽은 크게, 중앙(별빛 자리)은 비움, 투명도 높게.
const CLOUDS = [
  { left: '-24%', top: '-14%', scale: 0.34, opacity: 0.46, delay: 0.12, drift: 11, puffs: PUFFS_C },
  { left: '42%', top: '-20%', scale: 0.4, opacity: 0.48, delay: 0.0, drift: 13, puffs: PUFFS_B },
  { left: '118%', top: '-6%', scale: 0.36, opacity: 0.46, delay: 0.22, drift: 14, puffs: PUFFS_C },
  { left: '-30%', top: '40%', scale: 0.48, opacity: 0.48, delay: 0.3, drift: 9, puffs: PUFFS_A },
  { left: '128%', top: '46%', scale: 0.52, opacity: 0.5, delay: 0.45, drift: 8, puffs: PUFFS_C },
  { left: '-16%', top: '118%', scale: 0.74, opacity: 0.6, delay: 0.3, drift: 11, puffs: PUFFS_A },
  { left: '52%', top: '132%', scale: 0.84, opacity: 0.62, delay: 0.18, drift: 12, puffs: PUFFS_B },
  { left: '122%', top: '112%', scale: 0.76, opacity: 0.6, delay: 0.4, drift: 10, puffs: PUFFS_C },
]

// 슬링샷 물리: 당긴 '반대' 방향으로, 항상 하늘(위)을 향해 사선 발사
function launchVec(px: number, py: number) {
  let dx = -px
  let dy = -py
  if (Math.hypot(dx, dy) < 20) {
    dx = 0
    dy = -1
  } // 거의 안 당기고 놓으면 위로
  const m = Math.hypot(dx, dy) || 1
  return { x: dx / m, y: Math.min(dy / m, -0.3) } // 항상 위로 향함
}

// 종이비행기 SVG
function PaperPlane() {
  return (
    <svg width={150} height={112} viewBox="0 0 120 90" aria-hidden style={{ position: 'relative' }}>
      <polygon points="10,82 112,8 60,56" fill="#ffffff" />
      <polygon points="112,8 60,56 80,82" fill="#efe7dd" />
    </svg>
  )
}

const CREASE = '#d9d2c8'

// 종이를 비행기로 접는 절차 연출(wikiHow 단계). 단계별 모양을 플립하듯 전환.
function FoldSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const stages = [
    // 0) 펼친 종이
    <svg key="0" width={120} height={96} viewBox="0 0 120 96" aria-hidden>
      <rect x="38" y="6" width="44" height="84" rx="2" fill="#fff" stroke={CREASE} />
      <line x1="60" y1="8" x2="60" y2="88" stroke={CREASE} strokeDasharray="3 3" />
    </svg>,
    // 1) 위 모서리를 가운데로 (뾰족한 머리)
    <svg key="1" width={120} height={96} viewBox="0 0 120 96" aria-hidden>
      <polygon points="60,6 84,40 36,40" fill="#fff" stroke={CREASE} />
      <rect x="36" y="40" width="48" height="50" fill="#fff" stroke={CREASE} />
      <line x1="60" y1="8" x2="60" y2="88" stroke={CREASE} strokeDasharray="3 3" />
    </svg>,
    // 2) 반으로 접어 날개 폭 (직각삼각형)
    <svg key="2" width={120} height={96} viewBox="0 0 120 96" aria-hidden>
      <polygon points="60,8 60,90 30,90" fill="#fff" stroke={CREASE} />
      <polygon points="60,8 60,54 38,66" fill="#efe7dd" stroke={CREASE} />
    </svg>,
    // 3) 완성된 비행기
    <PaperPlane key="3" />,
  ]
  useEffect(() => {
    if (step >= stages.length - 1) {
      const t = setTimeout(onDone, 420)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep((s) => s + 1), 460)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, onDone])

  // 단계가 서로 '디졸브'되어 끊김 없이 잔잔하게 (grid로 같은 칸에 겹쳐 페이드)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <AnimatePresence>
        <motion.div
          key={step}
          style={{ gridArea: '1 / 1', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.18))' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {stages[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// 날리기 — 종이를 '탭하면 비행기로 접히고', 그 비행기를 '던지면(드래그-놓기)' 날아간다(seamless).
//  paper(탭) → plane(던질 수 있음) → flying(날아가고 onAnimationComplete로 완료).
export default function Plane({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('plane', PLANE_MESSAGES))
  const [phase, setPhase] = useState<'paper' | 'folding' | 'plane' | 'flying' | 'star'>('paper')
  const [dir, setDir] = useState({ x: 0.5, y: -1 })
  const [pull, setPull] = useState({ x: 0, y: 0 }) // 당기는 동안의 오프셋(미리보기)
  const [throwPower, setThrowPower] = useState(1) // 던진 세기(비행 거리 배율)
  const fired = useRef(false)
  const pullMag = useRef(0) // 긴장감 햅틱: 직전 당김 크기
  const pullAcc = useRef(0) // 긴장감 햅틱: 당김 변화 누적

  // 화면 이탈 시 진동 정리
  useEffect(() => () => stopVibration(), [])

  // 당기는 동안 긴장감 — 당김 변화가 쌓일 때마다 세기에 비례한 약한 펄스
  const onPull = (info: PanInfo) => {
    setPull({ x: info.offset.x, y: info.offset.y })
    const m = Math.hypot(info.offset.x, info.offset.y)
    pullAcc.current += Math.abs(m - pullMag.current)
    pullMag.current = m
    if (pullAcc.current >= PULL_HAPTIC_PX) {
      pullAcc.current = 0
      hapticTension(Math.min(1, m / MAXPULL))
    }
  }

  const tod = useTimeOfDay()
  // 배경이 밝은/노란 톤(일출·낮)이면 하얀 별빛, 어두운 시간대엔 연한 파스텔 노랑
  const warmBg = tod === 'dawn' || tod === 'day'
  // 코어는 흰빛, 글로우만 톤별로(어두운 밤=차가운 청백, 밝은 낮=따뜻한 백색)
  const starGlow = warmBg ? 'rgba(255,246,224,0.95)' : 'rgba(214,232,255,0.95)'

  // 별이 반짝인 뒤 마무리
  useEffect(() => {
    if (phase !== 'star') return
    const t = setTimeout(onDone, 3000) // 별빛 + 구름들이 떠오르는 동안 머무름
    return () => clearTimeout(t)
  }, [phase, onDone])

  const onThrow = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (fired.current) return
    fired.current = true
    const m = Math.hypot(info.offset.x, info.offset.y)
    setDir(launchVec(info.offset.x, info.offset.y)) // 당긴 반대 방향으로 발사
    setThrowPower(1.1 + Math.min(1, m / MAXPULL) * 1.2) // 세게 당길수록 더 힘차게 멀리
    hapticLaunch(Math.min(1, m / MAXPULL)) // 발사 순간 짧은 한 방
    pullAcc.current = 0
    pullMag.current = 0
    setPhase('flying')
  }

  const power = Math.min(1, Math.hypot(pull.x, pull.y) / MAXPULL)
  const aim = launchVec(pull.x, pull.y) // 미리보기: 실제 발사 방향(당긴 반대·위로)
  const angleDeg = (Math.atan2(aim.y, aim.x) * 180) / Math.PI
  const dirAngle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI // 발사 후 비행 방향(코끝 유지용)
  // 화면 안 한 지점까지만 날아가 그 자리에서 별이 됨(세게 던질수록 조금 더 멀리, 화면 안 유지)
  const flyDist = 112 + (throwPower - 1.1) * 26

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
          onTap={() => setPhase('folding')}
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

      {/* folding: 종이를 비행기로 접는 절차 연출 */}
      {phase === 'folding' && <FoldSequence onDone={() => setPhase('plane')} />}

      {/* plane: 접힌 비행기 — 잡고 던질 수 있음 */}
      {phase === 'plane' && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDrag={(_e, info) => onPull(info)}
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
          {/* 당기는 방향(=발사 방향)으로 코끝이 향하도록 회전. 기본 코 방향 ≈ -38° 보정 */}
          <div style={{ transform: `rotate(${power > 0.04 ? angleDeg + 38 : 0}deg)`, transition: 'transform 0.06s linear' }}>
            <PaperPlane />
          </div>
        </motion.div>
      )}

      {/* flying: 던진 방향·세기로 날아감 → 끝나면 onDone */}
      {phase === 'flying' && (
        <motion.div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            // 궤적을 그리며 화면 안 한 지점(dir*flyDist)으로 날아가 작아지며 도착 → 거기서 별이 됨
            x: [0, dir.x * flyDist * 0.5, dir.x * flyDist],
            y: [0, dir.y * flyDist * 0.5, dir.y * flyDist],
            scale: [1, 0.66, 0.3],
            opacity: [1, 1, 1],
            rotate: [0, dir.x * 12, dir.x * 18],
          }}
          transition={{ duration: 1.5, times: [0, 0.45, 1], ease: 'easeOut' }}
          onAnimationComplete={() => setPhase('star')}
        >
          <div style={{ position: 'relative', transform: `rotate(${dirAngle + 38}deg)` }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 60,
                height: 60,
                transform: 'translate(-50%,-50%)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,242,185,0.4) 0%, rgba(255,242,185,0) 70%)',
              }}
            />
            <PaperPlane />
          </div>
        </motion.div>
      )}

      {/* flying: 비행 중 뒤로 뿜는 연료 — 경로를 따라 크고 밝게 뿜어져 머물다 흩어짐 */}
      {/* 궤적 — 경로를 따라 점들이 '차례로 켜졌다 잦아들며' 그려짐(얇고 노란, 비행기보다 가늘게) */}
      {phase === 'flying' &&
        Array.from({ length: 16 }).map((_, j) => {
          const t = j / 15
          const px = dir.x * (t * flyDist)
          const py = dir.y * (t * flyDist)
          const sz = 5 + t * 3 // 5~8px — 비행기보다 훨씬 얇게
          return (
            <motion.span
              key={`trail${j}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: sz,
                height: sz,
                marginLeft: px - sz / 2,
                marginTop: py - sz / 2,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,247,190,0.95) 0%, rgba(255,230,135,0.6) 55%, rgba(255,230,135,0) 100%)',
                filter: 'blur(0.8px)',
                pointerEvents: 'none',
                zIndex: 4,
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1, 0.8] }}
              transition={{ duration: 1.0, delay: t * 1.2, ease: 'easeOut' }}
            />
          )
        })}

      {/* star: 다 날아간 뒤 별빛으로 반짝 + 연료가 구름이 되어 하늘에 떠오름 */}
      {phase === 'star' && <Star glow={starGlow} offsetX={dir.x * flyDist} offsetY={dir.y * flyDist} />}
      {phase === 'star' && CLOUDS.map((c, i) => <Cloud key={i} left={c.left} top={c.top} scale={c.scale} opacity={c.opacity} delay={c.delay} drift={c.drift} puffs={c.puffs} />)}

      {/* 당기는 동안: 방향 화살표 (슬링샷처럼 — 당긴 방향·세기 미리보기) */}
      {phase === 'plane' && power > 0.04 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 40 + power * 120,
            height: 6,
            marginTop: -3,
            transformOrigin: '0% 50%',
            transform: `rotate(${angleDeg}deg)`,
            pointerEvents: 'none',
            zIndex: 6,
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, right: 14, bottom: 0, borderRadius: 3, background: 'linear-gradient(90deg, rgba(174,224,232,0.15), rgba(174,224,232,0.95))' }} />
          <div style={{ position: 'absolute', right: 0, top: -5, width: 0, height: 0, borderLeft: '16px solid rgba(174,224,232,0.95)', borderTop: '8px solid transparent', borderBottom: '8px solid transparent' }} />
        </div>
      )}

      {/* 파워 게이지 — 당긴 세기 */}
      {phase === 'plane' && <Gauge value={power} from="#5b8fd6" to="#aee0e8" />}

      {/* 상단 행위 안내 캡션 */}
      {(phase === 'paper' || phase === 'plane') && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {phase === 'paper' ? '👆 종이를 탭하면 비행기로 접혀요' : '✈️ 당겼다 놓으면 날아가요'}
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {(phase === 'flying' || phase === 'star') && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, whiteSpace: 'pre-line', pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
