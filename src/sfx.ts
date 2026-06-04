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
      master.gain.value = 0.62 // 노멀 볼륨에서도 잘 들리게
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
  preloadSamples() // public/sfx/*.mp3 있으면 미리 로드(없으면 합성 유지)
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

// ── 하이브리드: public/sfx/<name>.mp3 있으면 '진짜 음원' 재생, 없으면 아래 합성으로 자동 대체 ──
// 넣을 수 있는 파일(있으면 그 소리, 없으면 합성):
//   slime.mp3(말랑이) · fire.mp3(장작, 루프) · firework.mp3(폭죽) · paper.mp3(종이접기) · shred.mp3(파쇄) · type.mp3(타자)
const SAMPLES = ['slime', 'squelch', 'fire', 'firework', 'paper', 'shred', 'type'] as const
type SampleName = (typeof SAMPLES)[number]
const buffers: Partial<Record<SampleName, AudioBuffer | null>> = {} // undefined=미시도 / null=없음 / AudioBuffer=로드됨
const onset: Partial<Record<SampleName, number>> = {} // 앞쪽 무음을 건너뛸 시작 지점(초) — 누름과 동시에 소리 나게
let preloaded = false

// 버퍼 앞부분 무음을 지나 '첫 소리'가 시작되는 지점(초)을 찾는다
function detectOnset(buf: AudioBuffer): number {
  try {
    const d = buf.getChannelData(0)
    const thr = 0.015
    const step = Math.max(1, Math.floor(buf.sampleRate / 2000)) // ~0.5ms 간격으로 스캔
    for (let i = 0; i < d.length; i += step) {
      if (Math.abs(d[i]) > thr) return Math.max(0, i / buf.sampleRate - 0.004)
    }
  } catch {
    /* noop */
  }
  return 0
}

// 가장 큰 소리(임팩트=뿌직) 지점 직전을 찾는다 — 트리거 즉시 그 임팩트가 터지게
function detectPeak(buf: AudioBuffer): number {
  try {
    const d = buf.getChannelData(0)
    const step = Math.max(1, Math.floor(buf.sampleRate / 4000))
    let max = 0
    let idx = 0
    for (let i = 0; i < d.length; i += step) {
      const a = Math.abs(d[i])
      if (a > max) {
        max = a
        idx = i
      }
    }
    return Math.max(0, idx / buf.sampleRate - 0.035) // 정점보다 조금 더 앞에서(즉시 터지게)
  } catch {
    return 0
  }
}

function preloadSamples() {
  const c = audio()
  if (!c || preloaded) return
  preloaded = true
  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
  SAMPLES.forEach((name) => {
    fetch(`${base}sfx/${name}.mp3`)
      .then((r) => {
        if (!r.ok) {
          buffers[name] = null
          return null
        }
        return r.arrayBuffer()
      })
      .then((ab) => (ab ? c.decodeAudioData(ab) : null))
      .then((buf) => {
        buffers[name] = buf ?? null
        // 일반 샘플은 앞 무음만 스킵 / squelch는 '뿌직' 임팩트 지점부터 시작(전환과 딱 맞게)
        if (buf) onset[name] = name === 'squelch' ? detectPeak(buf) : detectOnset(buf)
      })
      .catch(() => {
        buffers[name] = null
      })
  })
}

// 같은 종류 소리가 겹쳐 쌓이지 않게(연속 동작용) — 직전 보이스를 끊는다
const voices: Partial<Record<SampleName, AudioBufferSourceNode>> = {}

// 샘플 재생(있을 때만).
//  loop=true면 계속(불소리 등, 정지용 소스 반환).
//  그 외엔 dur만큼만 '짧게' 재생 후 페이드 정지 → 인터랙션 순간에만 톡(음악처럼 흐르지 않음).
//  randomStart=긴 녹음에서 매번 다른 구간을 집어 단조롭지 않게. solo=직전 같은 소리를 끊어 겹침 방지.
function playSample(
  name: SampleName,
  opts: { rate?: number; gain?: number; loop?: boolean; dur?: number; randomStart?: boolean; solo?: boolean; softLp?: number } = {},
): AudioBufferSourceNode | null {
  const c = audio()
  const buf = buffers[name]
  if (!c || !master || !buf) return null
  const { rate = 1, gain = 1, loop = false, dur, randomStart = false, solo = false, softLp } = opts
  if (solo && voices[name]) {
    try {
      voices[name]!.stop()
    } catch {
      /* noop */
    }
    voices[name] = undefined
  }
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = loop
  src.playbackRate.value = rate
  const g = c.createGain()
  g.gain.value = gain
  src.connect(g)
  // softLp가 있으면 날카로운 고역을 깎아 부드럽게(귀 아픔 방지)
  if (softLp) {
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = softLp
    lp.Q.value = 0.4
    g.connect(lp)
    lp.connect(master)
  } else {
    g.connect(master)
  }
  const span = dur ?? 0.2
  // randomStart면 무작위 구간, 아니면 앞 무음을 건너뛴 '첫 소리' 지점부터 → 누름과 동시에 들림
  const startAt = randomStart ? rnd() * Math.max(0, buf.duration - span - 0.05) : onset[name] ?? 0
  const t0 = c.currentTime
  src.start(t0, Math.min(startAt, Math.max(0, buf.duration - 0.06)))
  if (!loop && dur) {
    const end = t0 + dur
    try {
      g.gain.setValueAtTime(gain, Math.max(t0 + 0.001, end - 0.045))
      g.gain.linearRampToValueAtTime(0.0001, end) // 끝에서 살짝 페이드(클릭 방지)
    } catch {
      /* noop */
    }
    src.stop(end + 0.02)
  }
  if (solo) {
    voices[name] = src
    src.onended = () => {
      if (voices[name] === src) voices[name] = undefined
    }
  }
  return src
}

// ── 공(말랑이): 끈적·물기 가득한 슬라임 결(음정 있는 '보잉'=탱탱볼 느낌을 빼고 젖은 노이즈 스퀄치로) ──
// 꾹 누름: 슬라임이 끈적하게 눌리는 촉촉 스쿼시(저역 노이즈가 천천히 죄어들며 '슈읍')
// 그냥 만질 때(누름/탭) — 촉촉 슬라임
export function sfxPress() {
  if (!enabled) return
  if (playSample('slime', { rate: 0.9, gain: 1, dur: 0.42, randomStart: true, solo: true })) return
  noise(0.24, { filter: 'lowpass', freq: 820, sweepTo: 220, q: 1.2, peak: 0.18, attack: 0.025 })
  noise(0.1, { filter: 'lowpass', freq: 420, sweepTo: 180, q: 1, peak: 0.09, attack: 0.008, delay: 0.04 })
}
// 꾹 눌러 다음으로 넘어가는 순간(롱프레스 완료) — '약간 터지는' squelch
export function sfxSquelch() {
  if (!enabled) return
  if (playSample('squelch', { gain: 1, dur: 0.34, solo: true })) return
  // 합성 fallback: 터지는 듯한 젖은 팝
  noise(0.2, { filter: 'lowpass', freq: 950, sweepTo: 280, q: 1.4, peak: 0.2, attack: 0.004 })
  tone(180, 0.12, { type: 'sine', peak: 0.1, attack: 0.003, glideTo: 90 })
}
// 조물딱(문지름): 짧고 가벼운 물기 스퀄치(자주 울리므로 여리게)
export function sfxRub() {
  if (!enabled) return
  if (playSample('slime', { rate: 1.35, gain: 0.5, dur: 0.16, randomStart: true, solo: true })) return
  noise(0.06, { filter: 'lowpass', freq: 560 + rnd() * 260, sweepTo: 320 + rnd() * 120, q: 1.1, peak: 0.06, attack: 0.004 })
}
// 놓음: 끈적하게 떨어지며 늘어나는 슈러읍(suction) — 보잉 아님
export function sfxRelease() {
  if (!enabled) return
  if (playSample('slime', { rate: 1.1, gain: 0.95, dur: 0.4, randomStart: true, solo: true })) return
  noise(0.18, { filter: 'lowpass', freq: 460, sweepTo: 1020, q: 1.1, peak: 0.13, attack: 0.02 })
  noise(0.07, { filter: 'bandpass', freq: 1300, q: 1, peak: 0.05, attack: 0.004, delay: 0.05 })
}
// 벽 충돌: 물컹 부딪는 젖은 스플랫 + 낮은 sub 충격(보잉 없는 thud)
export function sfxWall(strength = 0.5) {
  if (!enabled) return
  const s = clamp(strength)
  if (playSample('slime', { rate: 0.8, gain: 0.7 + s * 0.4, dur: 0.28, randomStart: true, solo: true })) return
  noise(0.12, { filter: 'lowpass', freq: 540, sweepTo: 160, q: 1.2, peak: 0.09 + s * 0.13, attack: 0.002 })
  tone(70, 0.1, { type: 'sine', peak: 0.05 + s * 0.09, attack: 0.002 })
}

// ── 태우기: 장작 ASMR = 낮은 우르릉 + 공기 쉬익(hiss) 두 겹 bed + 타닥 크래클 ─────
let fireNodes: { src: AudioBufferSourceNode; g: GainNode; lfo: OscillatorNode }[] = []
let fireSample: AudioBufferSourceNode | null = null
export function sfxFireStart() {
  if (!enabled) return
  const c = audio()
  if (!c || !master || fireNodes.length || fireSample) return
  // fire.mp3 있으면 진짜 장작소리를 잔잔히 루프
  const s = playSample('fire', { loop: true, gain: 0.8 })
  if (s) {
    fireSample = s
    return
  }
  const layer = (type: BiquadFilterType, freq: number, q: number, peak: number, lfoHz: number, lfoDepth: number) => {
    const src = c.createBufferSource()
    src.buffer = getNoise(c)
    src.loop = true
    const f = c.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, c.currentTime)
    g.gain.exponentialRampToValueAtTime(peak, c.currentTime + 0.5)
    const lfo = c.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = lfoHz
    const lg = c.createGain()
    lg.gain.value = lfoDepth
    lfo.connect(lg)
    lg.connect(g.gain)
    src.connect(f)
    f.connect(g)
    g.connect(master!)
    src.start()
    lfo.start()
    fireNodes.push({ src, g, lfo })
  }
  layer('lowpass', 300, 0.6, 0.06, 3.2, 0.022) // 낮게 우르릉 타오르는 몸체
  layer('bandpass', 1500, 1.0, 0.045, 8.5, 0.02) // 공기 쉬익(hiss)
}
export function stopFire() {
  const c = audio()
  if (!c) return
  if (fireSample) {
    try {
      fireSample.stop(c.currentTime + 0.4)
    } catch {
      /* noop */
    }
    fireSample = null
  }
  if (!fireNodes.length) return
  fireNodes.forEach(({ src, g, lfo }) => {
    try {
      g.gain.cancelScheduledValues(c.currentTime)
      g.gain.setValueAtTime(Math.max(0.0002, g.gain.value), c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4)
      src.stop(c.currentTime + 0.45)
      lfo.stop(c.currentTime + 0.45)
    } catch {
      /* noop */
    }
  })
  fireNodes = []
}
// 타닥 — 장작 크래클: 둥근 팝 + 가끔 톡 튀는 스냅 + 낮은 나무 울림(밀도 높여 더 '불'답게)
export function sfxBurn() {
  if (!enabled) return
  noise(0.038, { filter: 'lowpass', freq: 1200 + rnd() * 800, q: 1.1, peak: 0.085, attack: 0.002 })
  if (rnd() < 0.6) noise(0.018, { filter: 'bandpass', freq: 2200 + rnd() * 1400, q: 2, peak: 0.06, attack: 0.001, delay: 0.015 + rnd() * 0.05 }) // 톡 튀는 스냅
  if (rnd() < 0.4) noise(0.03, { filter: 'lowpass', freq: 800 + rnd() * 500, q: 1, peak: 0.05, attack: 0.002, delay: 0.04 + rnd() * 0.06 })
  if (rnd() < 0.28) tone(64 + rnd() * 44, 0.12, { type: 'triangle', peak: 0.07, attack: 0.004 }) // 낮은 나무 울림
}

// ── 파쇄기 ──────────────────────────────────────────────────
// 갈기: 진짜 종이가 갈리는 소리 — 모터 저역 그르릉 + 종이 찢기는 거친 중역(지직)
export function sfxShredGrind() {
  if (!enabled) return
  if (playSample('shred', { rate: 0.9 + rnd() * 0.3, gain: 0.55, dur: 0.18, randomStart: true, solo: true })) return
  noise(0.1, { filter: 'lowpass', freq: 360 + rnd() * 120, q: 0.7, peak: 0.05, attack: 0.006 }) // 모터 그르릉
  noise(0.07, { filter: 'bandpass', freq: 1500 + rnd() * 900, q: 1.4, peak: 0.07, attack: 0.003 }) // 종이 찢기는 지직
}
// 폭죽: 불꽃놀이 — '펑'(저음 붐) + 터지는 노이즈 + 차차차 흩어지는 불꽃 알갱이(길게)
export function sfxShredBurst() {
  if (!enabled) return
  if (playSample('firework', { gain: 0.55, dur: 1.6, softLp: 3200 })) return
  tone(160, 0.3, { type: 'sine', peak: 0.34, attack: 0.002, glideTo: 42 }) // 펑(붐)
  noise(0.18, { filter: 'lowpass', freq: 2600, sweepTo: 240, q: 0.8, peak: 0.28, attack: 0.001 }) // 터지는 순간
  for (let k = 0; k < 16; k++) {
    // 사방으로 흩어지며 차차차 타는 불꽃 알갱이(밝은 고역, 길게 흩날림)
    noise(0.02 + rnd() * 0.015, { filter: 'bandpass', freq: 2000 + rnd() * 3200, q: 2.6, peak: 0.05, attack: 0.002, delay: 0.06 + k * 0.045 + rnd() * 0.04 })
  }
}

// ── 날리기 ──────────────────────────────────────────────────
// 종이 접힘: 종이 구겨지는 바삭바삭(불규칙한 아주 짧은 광대역 알갱이 다발 — 스윕·공명 없이 = 용수철 느낌 제거)
export function sfxPaperFold() {
  if (!enabled) return
  if (playSample('paper', { gain: 1, dur: 0.85, randomStart: true })) return
  // 사부작 알갱이 다발 — 짧고 무작위로 촘촘히(구김 텍스처)
  for (let k = 0; k < 26; k++) {
    noise(0.006 + rnd() * 0.012, { filter: 'highpass', freq: 2600 + rnd() * 1800, q: 0.4, peak: 0.04 + rnd() * 0.035, attack: 0.001, delay: rnd() * 0.85 })
  }
  // 접는 큰 동작 두 번 — 살짝 길게 쓸리는 결(여전히 광대역, 저음 없음)
  noise(0.07, { filter: 'highpass', freq: 1700, q: 0.4, peak: 0.06, attack: 0.006, delay: 0.16 })
  noise(0.07, { filter: 'highpass', freq: 1700, q: 0.4, peak: 0.055, attack: 0.006, delay: 0.5 })
}
// 잿가루 될 때: 부드러운 바람 한 줄기
export function sfxSoftWind() {
  if (!enabled) return
  noise(1.4, { filter: 'bandpass', freq: 460, sweepTo: 820, q: 0.9, peak: 0.06, attack: 0.5 })
  noise(1.2, { filter: 'lowpass', freq: 700, sweepTo: 520, q: 0.6, peak: 0.035, attack: 0.45, delay: 0.1 })
}
// 비행기가 별이 되어 반짝일 때: 찬란한 반짝(밝은 고음 벨이 쏟아지고 빛 스웰)
export function sfxStarTwinkle() {
  if (!enabled) return
  const notes = [1568, 2093, 2637, 3136, 2349, 1760]
  notes.forEach((f, i) => tone(f, 0.7 - i * 0.04, { type: 'triangle', peak: 0.13 - i * 0.012, attack: 0.004, delay: i * 0.06 }))
  tone(784, 0.95, { type: 'sine', peak: 0.08, attack: 0.06, delay: 0.02 }) // 빛 스웰
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
  const v = soft ? 0.55 : 1
  if (playSample('type', { rate: 0.95 + rnd() * 0.15, gain: v, dur: 0.12, randomStart: true, solo: true })) return
  noise(0.02, { filter: 'bandpass', freq: 2300 + rnd() * 700, q: 2.6, peak: 0.16 * v, attack: 0.001 })
  tone(150 + rnd() * 50, 0.045, { type: 'triangle', peak: 0.12 * v, attack: 0.002 })
}
// 기분 척도: 값 바뀔 때 작고 부드러운 나무 틱(값 높을수록 살짝 높은 음)
export function sfxMoodTick(value = 0) {
  if (!enabled) return
  tone(320 + value * 38, 0.14, { type: 'triangle', peak: 0.26, attack: 0.004 })
  tone((320 + value * 38) * 2, 0.1, { type: 'sine', peak: 0.1, attack: 0.004 }) // 살짝 또렷한 배음
}

// 시작 안내: 소리 테스트(부드러운 상승 3음)
export function sfxTest() {
  unlockAudio()
  const prev = enabled
  enabled = true
  ;[523, 659, 784].forEach((f, i) => tone(f, 0.5, { type: 'sine', peak: 0.22, attack: 0.01, delay: i * 0.13 }))
  enabled = prev
}
