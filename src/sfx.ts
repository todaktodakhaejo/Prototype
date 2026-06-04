// ─────────────────────────────────────────────────────────────
// ASMR 효과음 (Web Audio 합성) — 외부 음원 0 = 저작권 이슈 없음, 로딩 0.
// 결: 잔잔·따뜻. 각 인터랙션마다 '음색 자체'를 다르게(물방울/슬라임, 장작, 폭죽 펑,
//     바람 슈웅, 종이 사그락, 요술봉 뾰로롱, 타자기, 부드러운 틱) 설계해 똑같이 들리지 않게.
// iOS는 진동은 안 되지만 '소리는 됨' → 모든 기기에서 감각 피드백.
// ─────────────────────────────────────────────────────────────

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
const rnd = () => Math.random()

let enabled = readEnabled()
function readEnabled(): boolean {
  try {
    return localStorage.getItem('heulim.sfx') !== '0'
  } catch {
    return true
  }
}
export function isSfxEnabled(): boolean {
  return enabled
}
export function setSfxEnabled(v: boolean): void {
  enabled = v
  try {
    localStorage.setItem('heulim.sfx', v ? '1' : '0')
  } catch {
    /* noop */
  }
  if (v) unlockAudio()
  else stopFire()
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let unlocked = false

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.32
      const warmth = ctx.createBiquadFilter()
      warmth.type = 'lowpass'
      warmth.frequency.value = 6200
      warmth.Q.value = 0.3
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -20
      comp.knee.value = 26
      comp.ratio.value = 4
      comp.attack.value = 0.004
      comp.release.value = 0.18
      master.connect(warmth)
      warmth.connect(comp)
      comp.connect(ctx.destination)
    } catch {
      ctx = null
    }
  }
  return ctx
}

export function unlockAudio(): void {
  const c = audio()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  if (!unlocked) {
    unlocked = true
    try {
      const b = c.createBuffer(1, 1, 22050)
      const s = c.createBufferSource()
      s.buffer = b
      s.connect(c.destination)
      s.start(0)
    } catch {
      /* noop */
    }
  }
}

function getNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 1.5), c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1
  }
  return noiseBuf
}

function shape(g: GainNode, t0: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + Math.max(0.001, attack))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
}

interface ToneOpts {
  type?: OscillatorType
  peak?: number
  attack?: number
  glideTo?: number | null
  delay?: number
}
function tone(freq: number, dur: number, o: ToneOpts = {}) {
  const c = audio()
  if (!c || !master) return
  const { type = 'sine', peak = 0.3, attack = 0.008, glideTo = null, delay = 0 } = o
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t0 + dur)
  const g = c.createGain()
  shape(g, t0, peak, attack, dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.03)
}

interface NoiseOpts {
  filter?: BiquadFilterType
  freq?: number
  q?: number
  peak?: number
  attack?: number
  sweepTo?: number | null
  delay?: number
}
function noise(dur: number, o: NoiseOpts = {}) {
  const c = audio()
  if (!c || !master) return
  const { filter = 'lowpass', freq = 1000, q = 0.7, peak = 0.2, attack = 0.01, sweepTo = null, delay = 0 } = o
  const t0 = c.currentTime + delay
  const src = c.createBufferSource()
  src.buffer = getNoise(c)
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = filter
  f.frequency.setValueAtTime(freq, t0)
  f.Q.value = q
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur)
  const g = c.createGain()
  shape(g, t0, peak, attack, dur)
  src.connect(f)
  f.connect(g)
  g.connect(master)
  src.start(t0)
  src.stop(t0 + dur + 0.03)
}

// ── 공(말랑이): 물방울 + 슬라임 = 몰랑몰랑 ──────────────────────
// 누름: 위에서 톡 떨어지는 물방울(피치 하강) + 촉촉한 슬라임 눌림
export function sfxPress() {
  if (!enabled) return
  tone(880, 0.2, { type: 'sine', peak: 0.26, attack: 0.004, glideTo: 360 })
  noise(0.14, { filter: 'lowpass', freq: 700, sweepTo: 300, q: 0.8, peak: 0.12, attack: 0.006 })
}
// 뗌: 슬라임이 손에서 몰랑 떨어지는 느낌(피치 살짝 상승 + 촉촉)
export function sfxRelease() {
  if (!enabled) return
  tone(300, 0.22, { type: 'sine', peak: 0.2, attack: 0.01, glideTo: 520 })
  noise(0.1, { filter: 'lowpass', freq: 520, peak: 0.08, attack: 0.006 })
}
// 문지름: 촉촉한 슬라임 브러시(아주 여리게)
export function sfxRub() {
  if (!enabled) return
  noise(0.08, { filter: 'lowpass', freq: 480 + rnd() * 160, q: 0.6, peak: 0.05, attack: 0.006 })
}
// 벽 충돌: 푹신한 쿠션 thud(저역, 세기 비례)
export function sfxWall(strength = 0.5) {
  if (!enabled) return
  const s = clamp(strength)
  tone(120 + s * 40, 0.2, { type: 'sine', peak: 0.1 + s * 0.16, attack: 0.003, glideTo: 70 })
  noise(0.1, { filter: 'lowpass', freq: 240, peak: 0.05 + s * 0.08 })
}

// ── 태우기: 장작 타는 소리 = 지속 불소리(bed) + 타닥 크래클 ─────
let fire: { src: AudioBufferSourceNode; g: GainNode; lfo: OscillatorNode } | null = null
export function sfxFireStart() {
  if (!enabled) return
  const c = audio()
  if (!c || !master || fire) return
  const src = c.createBufferSource()
  src.buffer = getNoise(c)
  src.loop = true
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 760
  lp.Q.value = 0.5
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.07, c.currentTime + 0.5) // 서서히 번지는 불소리
  // 불꽃 일렁임(flicker) — gain을 미세하게 흔듦
  const lfo = c.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 6.5
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.03
  lfo.connect(lfoGain)
  lfoGain.connect(g.gain)
  src.connect(lp)
  lp.connect(g)
  g.connect(master)
  src.start()
  lfo.start()
  fire = { src, g, lfo }
}
export function stopFire() {
  const c = audio()
  if (!fire || !c) return
  const { src, g, lfo } = fire
  try {
    g.gain.cancelScheduledValues(c.currentTime)
    g.gain.setValueAtTime(Math.max(0.0002, g.gain.value), c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4)
    src.stop(c.currentTime + 0.45)
    lfo.stop(c.currentTime + 0.45)
  } catch {
    /* noop */
  }
  fire = null
}
// 타닥 — 장작 크래클(낮고 둥근 노이즈 팝 + 가끔 나무 울림, 랜덤). 타자기처럼 안 들리게 lowpass.
export function sfxBurn() {
  if (!enabled) return
  noise(0.04, { filter: 'lowpass', freq: 1300 + rnd() * 900, q: 1.1, peak: 0.09, attack: 0.002 })
  if (rnd() < 0.45) noise(0.025, { filter: 'lowpass', freq: 900 + rnd() * 700, q: 1, peak: 0.06, attack: 0.002, delay: 0.02 + rnd() * 0.05 })
  if (rnd() < 0.3) tone(70 + rnd() * 50, 0.1, { type: 'triangle', peak: 0.07, attack: 0.004 })
}

// ── 파쇄기 ──────────────────────────────────────────────────
// 갈기: 부들부들 부드러운 저역(날카롭지 않게)
export function sfxShredGrind() {
  if (!enabled) return
  noise(0.1, { filter: 'lowpass', freq: 540 + rnd() * 240, q: 0.5, peak: 0.06, attack: 0.008 })
}
// 폭죽: 진짜 '펑' — 저음 붐(피치 급강하) + 노이즈 버스트 + 차르르 잔불
export function sfxShredBurst() {
  if (!enabled) return
  tone(150, 0.3, { type: 'sine', peak: 0.34, attack: 0.002, glideTo: 44 }) // 펑(붐)
  noise(0.16, { filter: 'lowpass', freq: 2200, sweepTo: 280, q: 0.8, peak: 0.26, attack: 0.001 })
  for (let k = 0; k < 8; k++) {
    noise(0.022, { filter: 'bandpass', freq: 1500 + rnd() * 2600, q: 2.2, peak: 0.05, attack: 0.002, delay: 0.08 + k * 0.05 + rnd() * 0.03 })
  }
}

// ── 날리기 ──────────────────────────────────────────────────
// 종이 접힘: 사그락사그락 — 불규칙한 미세 노이즈 알갱이 다수
export function sfxPaperFold() {
  if (!enabled) return
  const n = 14
  for (let k = 0; k < n; k++) {
    noise(0.014 + rnd() * 0.01, { filter: 'bandpass', freq: 2400 + rnd() * 3000, q: 3, peak: 0.045 + rnd() * 0.03, attack: 0.002, delay: rnd() * 0.7 })
  }
}
// 당김: 여린 상승 긴장음
export function sfxTension(power = 0.5) {
  if (!enabled) return
  const p = clamp(power)
  tone(200 + p * 120, 0.13, { type: 'sine', peak: 0.04 + p * 0.06, attack: 0.02, glideTo: 250 + p * 170 })
}
// 발사: 슈웅 — 바람 소리(밴드패스 노이즈가 부풀며 위로 스윕)
export function sfxLaunch(power = 0.5) {
  if (!enabled) return
  const p = clamp(power)
  noise(0.5, { filter: 'bandpass', freq: 280, sweepTo: 1100 + p * 700, q: 1.3, peak: 0.13 + p * 0.08, attack: 0.13 })
  noise(0.42, { filter: 'lowpass', freq: 600, sweepTo: 1500, q: 0.6, peak: 0.06, attack: 0.1, delay: 0.02 })
}

// ── 보석함 ──────────────────────────────────────────────────
// 담기: 맑고 부드러운 plink 종소리
export function sfxJewelStore() {
  if (!enabled) return
  tone(760, 0.42, { type: 'sine', peak: 0.2, attack: 0.005 })
  tone(1140, 0.5, { type: 'sine', peak: 0.1, attack: 0.02, delay: 0.02 })
}
// 후광: 요술봉 흔드는 뾰로롱 — 빠르게 차오르는 반짝 벨 다수
export function sfxHaloShimmer() {
  if (!enabled) return
  const notes = [784, 988, 1175, 1397, 1568, 1760, 2093, 2349]
  notes.forEach((f, i) => tone(f, 0.5 - i * 0.025, { type: 'triangle', peak: 0.12 - i * 0.008, attack: 0.004, delay: i * 0.045 }))
}

// ── 글쓰기 / 기분 ───────────────────────────────────────────
// 타자: 키 한 번 — 또렷한 클릭(밴드패스) + 낮은 thunk. 키마다 살짝 다른 피치(진짜 타자기 느낌). del=여리게.
export function sfxType(soft = false) {
  if (!enabled) return
  const v = soft ? 0.5 : 1
  noise(0.018, { filter: 'bandpass', freq: 2300 + rnd() * 700, q: 2.6, peak: 0.07 * v, attack: 0.001 })
  tone(150 + rnd() * 50, 0.04, { type: 'triangle', peak: 0.05 * v, attack: 0.002 })
}
// 기분 척도: 값 바뀔 때 작고 부드러운 나무 틱(값 높을수록 살짝 높은 음)
export function sfxMoodTick(value = 0) {
  if (!enabled) return
  tone(320 + value * 38, 0.12, { type: 'triangle', peak: 0.12, attack: 0.004 })
}

// 시작 안내: 소리 테스트(부드러운 상승 3음)
export function sfxTest() {
  unlockAudio()
  const prev = enabled
  enabled = true
  ;[523, 659, 784].forEach((f, i) => tone(f, 0.5, { type: 'sine', peak: 0.22, attack: 0.01, delay: i * 0.13 }))
  enabled = prev
}
