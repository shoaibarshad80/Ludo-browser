// ============================================================
// Tiny WebAudio synth for game SFX (no asset files needed)
// ============================================================

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}

export function isMuted() {
  return muted
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, delay = 0, slideTo?: number) {
  const c = getCtx()
  if (!c || muted) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

function noise(dur: number, vol = 0.08, delay = 0) {
  const c = getCtx()
  if (!c || muted) return
  const t0 = c.currentTime + delay
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = c.createBufferSource()
  src.buffer = buffer
  const gain = c.createGain()
  gain.gain.value = vol
  src.connect(gain)
  gain.connect(c.destination)
  src.start(t0)
}

export const sfx = {
  dice() {
    for (let i = 0; i < 4; i++) noise(0.05, 0.06, i * 0.07)
    tone(220, 0.08, 'triangle', 0.05, 0.28)
  },
  step() {
    tone(520, 0.045, 'square', 0.035)
  },
  capture() {
    tone(700, 0.18, 'sawtooth', 0.1, 0, 160)
    noise(0.12, 0.07, 0.02)
  },
  /** airy slide for the captured pawn flying back to its yard */
  whoosh() {
    tone(520, 0.28, 'sine', 0.05, 0.04, 130)
    noise(0.2, 0.045, 0.04)
  },
  six() {
    tone(660, 0.1, 'sine', 0.09)
    tone(880, 0.12, 'sine', 0.09, 0.09)
  },
  finish() {
    tone(523, 0.09, 'sine', 0.1)
    tone(659, 0.09, 'sine', 0.1, 0.08)
    tone(784, 0.14, 'sine', 0.1, 0.16)
  },
  pass() {
    tone(300, 0.12, 'sine', 0.05, 0, 200)
  },
  emote() {
    tone(880, 0.07, 'triangle', 0.07)
    tone(1175, 0.07, 'triangle', 0.07, 0.06)
  },
  win() {
    const notes = [523, 659, 784, 1047, 784, 1047]
    notes.forEach((n, i) => tone(n, 0.16, 'triangle', 0.11, i * 0.12))
  },
  lose() {
    tone(392, 0.2, 'sine', 0.08)
    tone(311, 0.25, 'sine', 0.08, 0.18)
    tone(233, 0.35, 'sine', 0.08, 0.38)
  },
  coin() {
    tone(1319, 0.06, 'square', 0.06)
    tone(1760, 0.09, 'square', 0.06, 0.05)
  },
}
