// ─────────────────────────────────────────────────────────────
// ASMR 효과음 (Web Audio 합성) — 외부 음원 파일 없음 = 저작권 이슈 0, 로딩 0.
// 결: 잔잔하고 따뜻한 촉감. 날카로운 고역을 lowpass로 깎고, 완만한 attack/release,
//     컴프레서로 겹쳐도 부드럽게(클리핑 방지). 진동과 '같은 호출 지점'에서 함께 울린다.
// iOS(아이폰)는 진동은 안 되지만 '소리는 됨' → 모든 기기에서 감각 피드백 확보.
// ─────────────────────────────────────────────────────────────

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))

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
      master.gain.value = 0.3
      // 부드러운 따뜻함 — 날카로운 고역 제거
      const warmth = ctx.createBiquadFilter()
      warmth.type = 'lowpass'
      warmth.frequency.value = 5000
      warmth.Q.value = 0.3
      // 겹쳐 울려도 뭉개지지 않게 가볍게 눌러줌
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -22
      comp.knee.value = 26
      comp.ratio.value = 4
      comp.attack.value = 0.005
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

// 첫 사용자 제스처에서 오디오 잠금 해제(iOS 필수) — 매 제스처마다 호출해도 가벼움
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
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 1.2), c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

// 완만한 엔벨로프(부드러운 소멸) — exp ramp는 0 불가라 0.0001로
function shape(g: GainNode, t0: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack)
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
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
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
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur)
  const g = c.createGain()
  shape(g, t0, peak, attack, dur)
  src.connect(f)
  f.connect(g)
  g.connect(master)
  src.start(t0)
  src.stop(t0 + dur + 0.03)
}

// ── 인터랙션별 효과음 (진동과 동일 시점) ───────────────────────

// 공: 누름 — 말랑한 물방울 "plip"
export function sfxPress() {
  if (!enabled) return
  tone(330, 0.16, { peak: 0.3, attack: 0.005, glideTo: 290 })
  noise(0.05, { filter: 'lowpass', freq: 900, peak: 0.05 })
}
// 공: 뗌 — 부드러운 두 음 "삐-용"
export function sfxRelease() {
  if (!enabled) return
  tone(380, 0.12, { peak: 0.2, attack: 0.006 })
  tone(520, 0.2, { peak: 0.24, attack: 0.012, delay: 0.06 })
}
// 공: 문지름 — 아주 여린 브러시 틱(자주 울리므로 작게)
export function sfxRub() {
  if (!enabled) return
  noise(0.06, { filter: 'bandpass', freq: 1050, q: 0.8, peak: 0.045 })
}
// 공: 벽 충돌 — 푹신한 쿠션 범프(세기 비례)
export function sfxWall(strength = 0.5) {
  if (!enabled) return
  const s = clamp(strength)
  tone(118 + s * 44, 0.18, { peak: 0.1 + s * 0.16, attack: 0.004 })
  noise(0.09, { filter: 'lowpass', freq: 300, peak: 0.05 + s * 0.09 })
}
// 태우기: 타닥타닥 장작 크래클(짧은 노이즈 + 가끔 낮은 울림, 살짝 랜덤)
export function sfxBurn() {
  if (!enabled) return
  noise(0.03, { filter: 'bandpass', freq: 1700 + Math.random() * 1400, q: 1.2, peak: 0.09 })
  if (Math.random() < 0.5) noise(0.022, { filter: 'bandpass', freq: 2300 + Math.random() * 1100, q: 1.4, peak: 0.06, delay: 0.03 + Math.random() * 0.04 })
  if (Math.random() < 0.22) tone(90, 0.13, { type: 'triangle', peak: 0.07, attack: 0.006 })
}
// 파쇄기: 부들부들 부드러운 저역 갈림(날카롭지 않게)
export function sfxShredGrind() {
  if (!enabled) return
  noise(0.1, { filter: 'lowpass', freq: 660 + Math.random() * 280, q: 0.6, peak: 0.07 })
}
// 파쇄기: 폭죽 — 부드러운 공기 펑 + 잔잔한 반짝
export function sfxShredBurst() {
  if (!enabled) return
  noise(0.18, { filter: 'lowpass', freq: 1200, sweepTo: 380, peak: 0.13 })
  tone(660, 0.18, { peak: 0.11, attack: 0.012, delay: 0.02 })
  tone(990, 0.22, { peak: 0.07, attack: 0.02, delay: 0.06 })
}
// 날리기: 당기는 긴장(여린 상승음)
export function sfxTension(power = 0.5) {
  if (!enabled) return
  const p = clamp(power)
  tone(220 + p * 130, 0.13, { peak: 0.04 + p * 0.06, attack: 0.02 })
}
// 날리기: 발사 — 포근한 공기 "슝"(필터 스윕)
export function sfxLaunch(power = 0.5) {
  if (!enabled) return
  const p = clamp(power)
  noise(0.34, { filter: 'bandpass', freq: 480, sweepTo: 1500 + p * 900, q: 0.7, peak: 0.1 + p * 0.07, attack: 0.02 })
}
// 보석함: 담기 — 맑고 부드러운 "plink" 종소리
export function sfxJewelStore() {
  if (!enabled) return
  tone(740, 0.4, { peak: 0.2, attack: 0.006 })
  tone(1110, 0.5, { peak: 0.1, attack: 0.02, delay: 0.02 })
}
// 보석함: 후광/두근 — 뾰로롱 상승 벨 3음
export function sfxHaloShimmer() {
  if (!enabled) return
  ;[660, 880, 1175].forEach((f, i) => tone(f, 0.6, { peak: 0.15 - i * 0.02, attack: 0.02, delay: i * 0.12 }))
}
// 시작 안내: 소리 테스트(부드러운 상승 3음)
export function sfxTest() {
  unlockAudio()
  const prev = enabled
  enabled = true
  ;[523, 659, 784].forEach((f, i) => tone(f, 0.5, { peak: 0.22, attack: 0.01, delay: i * 0.13 }))
  enabled = prev
}
