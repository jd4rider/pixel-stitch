let ctx = null
export const audioState = { muted: false }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, { type = 'sine', dur = 0.18, gain = 0.12, delay = 0 } = {}) {
  if (audioState.muted || !Number.isFinite(freq)) return
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const osc = a.createOscillator()
  const amp = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(amp).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise({ dur = 0.3, gain = 0.16, freq = 800, delay = 0 } = {}) {
  if (audioState.muted) return
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2
  const src = a.createBufferSource()
  src.buffer = buf
  const filter = a.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(freq * 3, t)
  filter.frequency.exponentialRampToValueAtTime(freq, t + dur)
  const amp = a.createGain()
  amp.gain.value = gain
  src.connect(filter).connect(amp).connect(a.destination)
  src.start(t)
}

const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19]
const note = (step) => 523.25 * 2 ** (SCALE[Math.max(0, Math.min(step, SCALE.length - 1))] / 12)

export const sfx = {
  paint: () => tone(520, { type: 'triangle', dur: 0.06, gain: 0.05 }),
  cross: () => tone(330, { type: 'square', dur: 0.05, gain: 0.03 }),
  erase: () => tone(220, { type: 'triangle', dur: 0.06, gain: 0.04 }),
  wrong: () => {
    tone(180, { type: 'sawtooth', dur: 0.12, gain: 0.05 })
    tone(140, { type: 'sawtooth', dur: 0.14, gain: 0.05, delay: 0.08 })
  },
  line: (index = 0) => {
    tone(note(index), { type: 'triangle', dur: 0.16, gain: 0.07 })
    tone(note(index + 2) * 1.5, { dur: 0.2, gain: 0.04, delay: 0.04 })
  },
  hint: () => [0, 4].forEach((s, i) => tone(660 * 2 ** (s / 12), { type: 'triangle', dur: 0.12, gain: 0.05, delay: i * 0.07 })),
  click: () => tone(660, { dur: 0.06, gain: 0.05, type: 'triangle' }),
  sparkle: () => [0, 4, 7, 12].forEach((s, i) => tone(784 * 2 ** (s / 12), { dur: 0.18, gain: 0.04, delay: i * 0.05 })),
  win: () => {
    noise({ dur: 0.5, gain: 0.06, freq: 1400 })
    ;[0, 4, 7, 12, 16].forEach((s, i) => tone(523.25 * 2 ** (s / 12), { dur: 0.4, delay: i * 0.09 }))
  },
  whoosh: () => noise({ dur: 0.45, gain: 0.05, freq: 1100 }),
}
