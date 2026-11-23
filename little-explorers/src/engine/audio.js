import { createMusicEngine } from './music'
import { playSfx } from './sfx'
import { pickMandarinVoice } from './voices'

const clamp = (value, min, max, fallback) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function estimateDuration(text) {
  // 没有语音合成时的“阅读节奏”，保证字幕不会一闪而过
  return Math.max(1700, String(text || '').length * 190)
}

/**
 * 音频总控：
 * - 背景音乐：程序化合成（见 music.js）
 * - 音效：程序化合成（见 sfx.js）
 * - 旁白：优先播放故事音频文件；没有文件时用浏览器语音合成（中文）
 *
 * 手机浏览器不允许自动播放，所以必须由用户第一次点击触发 unlock()。
 */
class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.music = null
    this.volume = 0.8
    this.musicEnabled = true
    this.narrationEnabled = true
    this.rate = 0.92
    this.narrating = false
    this.narrationToken = 0
    this.voice = null
    this.voices = []
    this.mandarinMissing = false
    this.currentAudio = null
    this.speechReady = typeof window !== 'undefined' && 'speechSynthesis' in window

    if (this.speechReady) {
      this.refreshVoices()
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this.refreshVoices())
      setTimeout(() => this.refreshVoices(), 500)
    }
  }

  get isUnlocked() {
    return Boolean(this.ctx && this.ctx.state === 'running')
  }

  get canSpeak() {
    return this.speechReady && Boolean(this.voice)
  }

  refreshVoices() {
    if (!this.speechReady) return
    try {
      const voices = window.speechSynthesis.getVoices() || []
      this.voices = voices
      this.voice = pickMandarinVoice(voices)
      if (!this.voice && voices.length && !this.mandarinMissing) {
        this.mandarinMissing = true
        console.info(
          '[little-explorers] 设备上没有找到普通话语音，旁白将改用字幕节奏，避免用粤语朗读。',
        )
      }
    } catch (error) {
      console.warn('[little-explorers] 读取语音列表失败', error)
    }
  }

  /** 必须在用户手势中调用一次 */
  unlock() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return false
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume * 0.9
      this.master.connect(this.ctx.destination)
      this.music = createMusicEngine(this.ctx, this.master)
      this.music.setEnabled(this.musicEnabled)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
    this.refreshVoices()
    return true
  }

  setVolume(value) {
    this.volume = clamp(value, 0, 1, 0.8)
    if (this.master) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setTargetAtTime(this.volume * 0.9, now, 0.05)
    }
    if (this.currentAudio) this.currentAudio.volume = this.volume
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled)
    this.music?.setEnabled(this.musicEnabled)
  }

  setNarrationEnabled(enabled) {
    this.narrationEnabled = Boolean(enabled)
  }

  setRate(rate) {
    this.rate = clamp(rate, 0.7, 1.2, 0.92)
  }

  startMusic() {
    if (!this.ctx) return
    this.music?.start()
    this.music?.setEnabled(this.musicEnabled)
  }

  stopMusic() {
    this.music?.stop()
  }

  duckMusic(on) {
    this.music?.setDucked(on)
  }

  playSfx(name, amount = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return
    playSfx(this.ctx, this.master, name, amount)
  }

  /** 旁白：逐句播放，返回是否完整播完 */
  async narrate(lines, { onLine, rate } = {}) {
    const token = ++this.narrationToken
    this.narrating = true
    this.cancelSpeech()
    this.duckMusic(true)
    const speakRate = clamp(rate ?? this.rate, 0.7, 1.2, 0.92)

    try {
      for (let index = 0; index < lines.length; index += 1) {
        if (token !== this.narrationToken) return false
        const line = typeof lines[index] === 'string' ? { text: lines[index] } : lines[index]
        const text = line?.text || ''
        onLine?.(text, index)

        if (line?.audio) {
          await this.playNarrationFile(line.audio, text)
        } else if (this.narrationEnabled && this.canSpeak) {
          await this.speakText(text, speakRate)
        } else {
          await delay(estimateDuration(text))
        }

        if (token !== this.narrationToken) return false
        await delay(200)
      }
      if (token !== this.narrationToken) return false
      return true
    } finally {
      if (token === this.narrationToken) {
        this.narrating = false
        this.duckMusic(false)
      }
    }
  }

  stopNarration() {
    this.narrationToken += 1
    this.narrating = false
    this.cancelSpeech()
    if (this.currentAudio) {
      try {
        this.currentAudio.pause()
        this.currentAudio.src = ''
      } catch {
        /* 忽略 */
      }
      this.currentAudio = null
    }
    this.duckMusic(false)
  }

  /** 点击物体时的短句反馈，不打断正在播放的旁白 */
  speakShort(text) {
    if (!text || this.narrating || !this.narrationEnabled || !this.canSpeak) return
    this.cancelSpeech()
    const utterance = new SpeechSynthesisUtterance(String(text))
    utterance.lang = this.voice?.lang || 'zh-CN'
    utterance.rate = 0.98
    utterance.pitch = 1.08
    utterance.volume = 1
    if (this.voice) utterance.voice = this.voice
    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.warn('[little-explorers] 语音播放失败', error)
    }
  }

  speakText(text, rate = this.rate) {
    return new Promise((resolve) => {
      if (!this.canSpeak || !text) {
        delay(estimateDuration(text)).then(resolve)
        return
      }
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        clearTimeout(watchdog)
        resolve()
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = this.voice?.lang || 'zh-CN'
      utterance.rate = rate
      utterance.pitch = 1.06
      utterance.volume = 1
      if (this.voice) utterance.voice = this.voice
      utterance.onend = finish
      utterance.onerror = finish

      // 某些浏览器不会触发 onend，用看门狗兜底
      const watchdog = setTimeout(finish, Math.min(15000, 1400 + text.length * 300 / rate))
      try {
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.warn('[little-explorers] 语音播放失败', error)
        finish()
      }
    })
  }

  playNarrationFile(src, text = '') {
    return new Promise((resolve) => {
      const audio = new Audio(src)
      audio.volume = this.volume
      this.currentAudio = audio
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        clearTimeout(watchdog)
        if (this.currentAudio === audio) this.currentAudio = null
        resolve()
      }
      audio.addEventListener('ended', finish)
      audio.addEventListener('error', finish)
      const watchdog = setTimeout(finish, 20000)
      audio.play().catch(() => {
        // 自动播放被拦截时退回语音合成
        this.speakText(text).then(finish)
      })
    })
  }

  cancelSpeech() {
    if (!this.speechReady) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* 忽略 */
    }
  }
}

export const audio = new AudioEngine()
