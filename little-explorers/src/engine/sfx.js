/**
 * 交互音效：全部由 Web Audio 实时合成，不依赖音频文件。
 * 声音都做得短、软、圆润，避免吓到小朋友。
 */

let noiseCache = new WeakMap()

function noiseBuffer(ctx, seconds = 0.6) {
  let buffer = noiseCache.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
    noiseCache.set(ctx, buffer)
  }
  return buffer
}

function blip(ctx, out, options) {
  const {
    freq = 440,
    to = null,
    type = 'sine',
    when = 0,
    dur = 0.2,
    gain = 0.1,
    attack = 0.006,
    filterFreq = null,
    detune = 0,
  } = options
  const t = ctx.currentTime + when
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.linearRampToValueAtTime(gain, t + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.9)
  osc.detune.value = detune

  let tail = osc
  if (filterFreq) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq
    osc.connect(filter)
    tail = filter
  }
  tail.connect(amp)
  amp.connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function noiseBurst(ctx, out, options) {
  const {
    when = 0,
    dur = 0.1,
    gain = 0.1,
    type = 'highpass',
    freq = 2000,
    q = 1,
    sweepTo = null,
  } = options
  const t = ctx.currentTime + when
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)

  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(freq, t)
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur)
  filter.Q.value = q

  const amp = ctx.createGain()
  amp.gain.setValueAtTime(gain, t)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  src.connect(filter)
  filter.connect(amp)
  amp.connect(out)
  src.start(t)
  src.stop(t + dur + 0.05)
}

const SOUNDS = {
  chime(ctx, out) {
    blip(ctx, out, { freq: 880, dur: 0.9, gain: 0.055 })
    blip(ctx, out, { freq: 1318.51, when: 0.1, dur: 0.9, gain: 0.04 })
    blip(ctx, out, { freq: 1760, when: 0.2, dur: 0.8, gain: 0.02 })
  },

  sparkle(ctx, out) {
    ;[1046.5, 1318.51, 1567.98, 2093].forEach((freq, index) => {
      blip(ctx, out, { freq, when: index * 0.06, dur: 0.24, gain: 0.04 })
    })
  },

  pop(ctx, out) {
    blip(ctx, out, { freq: 320, to: 760, dur: 0.13, gain: 0.16 })
    noiseBurst(ctx, out, { dur: 0.035, gain: 0.05, type: 'highpass', freq: 2600 })
  },

  click(ctx, out) {
    blip(ctx, out, { freq: 540, to: 380, dur: 0.06, gain: 0.06 })
    noiseBurst(ctx, out, { dur: 0.03, gain: 0.035, type: 'highpass', freq: 3200 })
  },

  horn(ctx, out) {
    ;[0, 0.26].forEach((when) => {
      blip(ctx, out, { freq: 392, type: 'square', when, dur: 0.2, gain: 0.045, filterFreq: 1200 })
      blip(ctx, out, { freq: 523.25, type: 'square', when, dur: 0.2, gain: 0.035, filterFreq: 1400 })
    })
  },

  boing(ctx, out) {
    blip(ctx, out, { freq: 190, to: 540, dur: 0.18, gain: 0.13 })
    blip(ctx, out, { freq: 540, to: 300, when: 0.16, dur: 0.22, gain: 0.06 })
  },

  whoosh(ctx, out) {
    noiseBurst(ctx, out, {
      dur: 0.45,
      gain: 0.1,
      type: 'bandpass',
      freq: 620,
      sweepTo: 2400,
      q: 0.9,
    })
  },

  page(ctx, out) {
    noiseBurst(ctx, out, {
      dur: 0.34,
      gain: 0.055,
      type: 'bandpass',
      freq: 480,
      sweepTo: 1900,
      q: 0.8,
    })
  },

  raindrop(ctx, out) {
    blip(ctx, out, { freq: 1400, to: 820, dur: 0.13, gain: 0.045 })
    noiseBurst(ctx, out, { dur: 0.05, gain: 0.025, type: 'highpass', freq: 4200 })
  },

  quack(ctx, out) {
    ;[0, 0.17].forEach((when) => {
      blip(ctx, out, {
        freq: 760,
        to: 430,
        type: 'sawtooth',
        when,
        dur: 0.13,
        gain: 0.04,
        filterFreq: 1500,
      })
    })
  },

  clap(ctx, out) {
    ;[0, 0.11].forEach((when) => {
      noiseBurst(ctx, out, { when, dur: 0.09, gain: 0.11, type: 'bandpass', freq: 1700, q: 0.7 })
    })
  },

  night(ctx, out) {
    ;[783.99, 659.25, 523.25].forEach((freq, index) => {
      blip(ctx, out, { freq, when: index * 0.19, dur: 1.1, gain: 0.045 })
    })
  },

  yawn(ctx, out) {
    blip(ctx, out, { freq: 420, to: 300, dur: 0.5, gain: 0.035, filterFreq: 900 })
  },

  // 小鸟：两声短促的上滑音，像啾啾
  bird(ctx, out) {
    ;[0, 0.16].forEach((when) => {
      blip(ctx, out, { freq: 1250, to: 2100, when, dur: 0.12, gain: 0.05, type: 'sine', attack: 0.012 })
    })
    blip(ctx, out, { freq: 1900, to: 1500, when: 0.34, dur: 0.11, gain: 0.038 })
  },

  // 海浪：一段缓起缓落的白噪声，用低通滤掉刺耳的高频
  wave(ctx, out) {
    noiseBurst(ctx, out, {
      dur: 1.7,
      gain: 0.07,
      type: 'lowpass',
      freq: 900,
      sweepTo: 320,
      q: 0.6,
    })
    noiseBurst(ctx, out, {
      when: 0.5,
      dur: 1.4,
      gain: 0.045,
      type: 'lowpass',
      freq: 1400,
      sweepTo: 500,
      q: 0.5,
    })
  },

  // 树叶沙沙
  leaf(ctx, out) {
    noiseBurst(ctx, out, {
      dur: 0.5,
      gain: 0.05,
      type: 'highpass',
      freq: 2600,
      sweepTo: 5200,
      q: 0.8,
    })
  },

  // 消防车：故意做成柔和的两声，不用真实刺耳警笛
  siren(ctx, out) {
    ;[0, 0.42].forEach((when) => {
      blip(ctx, out, {
        freq: 520,
        to: 720,
        when,
        dur: 0.34,
        gain: 0.05,
        type: 'triangle',
        filterFreq: 1800,
      })
      blip(ctx, out, {
        freq: 720,
        to: 540,
        when: when + 0.34,
        dur: 0.3,
        gain: 0.04,
        type: 'triangle',
        filterFreq: 1800,
      })
    })
  },

  // 晚安：一个很轻的下行音
  sleepy(ctx, out) {
    ;[523.25, 440, 349.23].forEach((freq, index) => {
      blip(ctx, out, { freq, when: index * 0.28, dur: 0.8, gain: 0.04, attack: 0.03 })
    })
  },
}

export function playSfx(ctx, destination, name, amount = 1) {
  const sound = SOUNDS[name]
  if (!sound || !ctx || !destination) return
  try {
    sound(ctx, destination, amount)
  } catch (error) {
    console.warn('[little-explorers] 音效播放失败', name, error)
  }
}

export const SFX_NAMES = Object.keys(SOUNDS)
