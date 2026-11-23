/**
 * 轻量的程序化背景音乐（Web Audio）。
 *
 * 不依赖任何音频文件：木琴 / 拨弦 / 低音 / 沙锤都由振荡器实时合成，
 * 因此首屏零音频资源、零版权风险，也方便以后替换成真实录音。
 */

const TEMPO = 84
const BEAT = 60 / TEMPO
const STEP = BEAT / 2 // 八分音符
const STEPS_PER_BAR = 8
const BARS = 8
const TOTAL_STEPS = BARS * STEPS_PER_BAR

// I – vi – IV – V，两遍
const CHORDS = [
  { bass: 48, notes: [60, 64, 67] }, // C
  { bass: 45, notes: [57, 60, 64] }, // Am
  { bass: 41, notes: [53, 57, 60] }, // F
  { bass: 43, notes: [55, 59, 62] }, // G
  { bass: 48, notes: [60, 64, 67] },
  { bass: 45, notes: [57, 60, 64] },
  { bass: 41, notes: [53, 57, 60] },
  { bass: 43, notes: [55, 59, 62] },
]

// C 大调五声音阶旋律，第二遍略微上扬
const MELODY = [
  [72, 76, 79, 76, 74, 72, 69, null],
  [69, 72, 76, 72, 74, 76, 79, null],
  [77, 76, 74, 72, 69, 72, 74, null],
  [74, 72, 71, 67, 69, 72, 74, null],
  [72, 76, 79, 84, 83, 79, 76, null],
  [81, 79, 76, 72, 74, 76, 79, null],
  [77, 79, 81, 79, 77, 74, 72, null],
  [74, 71, 67, 69, 71, 74, 79, null],
].flat()

const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12)

export function createMusicEngine(ctx, destination) {
  let started = false
  let enabled = true
  let ducked = false
  let timer = null
  let step = 0
  let nextTime = 0

  const bus = ctx.createGain()
  bus.gain.value = 0

  // 一点点回声，让拨弦更柔和
  const delay = ctx.createDelay(0.6)
  delay.delayTime.value = 0.26
  const feedback = ctx.createGain()
  feedback.gain.value = 0.18
  const delayTone = ctx.createBiquadFilter()
  delayTone.type = 'lowpass'
  delayTone.frequency.value = 1800
  const delayWet = ctx.createGain()
  delayWet.gain.value = 0.16
  bus.connect(destination)
  bus.connect(delay)
  delay.connect(delayTone)
  delayTone.connect(feedback)
  feedback.connect(delay)
  delayTone.connect(delayWet)
  delayWet.connect(destination)

  const pluckBus = ctx.createGain()
  pluckBus.gain.value = 0.9
  pluckBus.connect(bus)
  pluckBus.connect(delay)

  const noise = makeNoiseBuffer(ctx, 0.12)

  function applyGain(immediate = false) {
    const target = enabled ? (ducked ? 0.3 : 1) : 0
    const now = ctx.currentTime
    bus.gain.cancelScheduledValues(now)
    if (immediate) bus.gain.setValueAtTime(target, now)
    else bus.gain.setTargetAtTime(target, now, 0.18)
  }

  function pluck(time, midi, gain = 0.055, dur = 0.62) {
    const freq = midiToFreq(midi)
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.linearRampToValueAtTime(gain, time + 0.008)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2600, time)
    filter.frequency.exponentialRampToValueAtTime(900, time + dur)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    osc.detune.value = 3

    const shimmer = ctx.createOscillator()
    shimmer.type = 'sine'
    shimmer.frequency.value = freq * 2
    shimmer.detune.value = -4

    const shimmerGain = ctx.createGain()
    shimmerGain.gain.value = 0.22

    osc.connect(filter)
    shimmer.connect(shimmerGain)
    shimmerGain.connect(filter)
    filter.connect(amp)
    amp.connect(pluckBus)

    osc.start(time)
    shimmer.start(time)
    osc.stop(time + dur + 0.05)
    shimmer.stop(time + dur + 0.05)
  }

  function bassNote(time, midi, dur) {
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.linearRampToValueAtTime(0.05, time + 0.02)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = midiToFreq(midi)
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = midiToFreq(midi - 12)
    const subGain = ctx.createGain()
    subGain.gain.value = 0.35
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420

    osc.connect(amp)
    sub.connect(subGain)
    subGain.connect(amp)
    amp.connect(filter)
    filter.connect(bus)

    osc.start(time)
    sub.start(time)
    osc.stop(time + dur + 0.05)
    sub.stop(time + dur + 0.05)
  }

  function pad(time, notes, dur) {
    notes.forEach((midi, index) => {
      const amp = ctx.createGain()
      amp.gain.setValueAtTime(0.0001, time)
      amp.gain.linearRampToValueAtTime(0.016, time + 0.8)
      amp.gain.setValueAtTime(0.016, time + dur * 0.8)
      amp.gain.exponentialRampToValueAtTime(0.0001, time + dur * 1.15)

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = midiToFreq(midi)
      osc.detune.value = (index - 1) * 4

      osc.connect(amp)
      amp.connect(bus)
      osc.start(time)
      osc.stop(time + dur * 1.2)
    })
  }

  function shaker(time, gain = 0.01) {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 6500
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(gain, time)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
    src.connect(filter)
    filter.connect(amp)
    amp.connect(bus)
    src.start(time)
    src.stop(time + 0.08)
  }

  function scheduleStep(index, time) {
    const bar = Math.floor(index / STEPS_PER_BAR)
    const inBar = index % STEPS_PER_BAR
    const chord = CHORDS[bar]

    if (inBar === 0) {
      pad(time, chord.notes, BEAT * 4)
      bassNote(time, chord.bass, BEAT * 1.4)
    }
    if (inBar === 4) {
      bassNote(time, chord.bass, BEAT * 1.1)
    }

    const note = MELODY[index % TOTAL_STEPS]
    if (note) {
      pluck(time, note, inBar === 0 ? 0.06 : 0.048, inBar === 0 ? 0.8 : 0.58)
      // 偶尔加一个高八度轻音，像阳光闪了一下
      if (index % 16 === 4) pluck(time + 0.02, note + 12, 0.018, 0.42)
    }

    if (inBar === 2 || inBar === 6) shaker(time, inBar === 2 ? 0.011 : 0.008)
  }

  function tick() {
    if (!started) return
    const now = ctx.currentTime
    if (nextTime < now - 0.4) nextTime = now + 0.05
    while (nextTime < now + 0.22) {
      scheduleStep(step, nextTime)
      step = (step + 1) % TOTAL_STEPS
      nextTime += STEP
    }
  }

  function start() {
    if (started) return
    started = true
    enabled = true
    ducked = false
    step = 0
    nextTime = ctx.currentTime + 0.12
    applyGain(true)
    timer = setInterval(tick, 60)
    tick()
  }

  function stop() {
    if (!started) return
    started = false
    clearInterval(timer)
    timer = null
    const now = ctx.currentTime
    bus.gain.cancelScheduledValues(now)
    bus.gain.setTargetAtTime(0, now, 0.12)
  }

  function setEnabled(value) {
    enabled = Boolean(value)
    applyGain()
  }

  function setDucked(value) {
    ducked = Boolean(value)
    applyGain()
  }

  return { start, stop, setEnabled, setDucked }
}

function makeNoiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}
