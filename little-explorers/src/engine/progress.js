import { reactive, watch } from 'vue'

const STORAGE_KEY = 'little-explorers:v1'

const DEFAULTS = {
  settings: {
    volume: 0.8,
    music: true,
    narration: true,
    rate: 0.92,
    reduceMotion: false,
    ageFilter: 'all',
  },
  progress: {},
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch (error) {
    console.warn('[little-explorers] 无法读取本地设置', error)
    return null
  }
}

function mergeSettings(input) {
  const settings = { ...DEFAULTS.settings, ...(input || {}) }
  settings.volume = clamp(Number(settings.volume), 0, 1, DEFAULTS.settings.volume)
  settings.rate = clamp(Number(settings.rate), 0.7, 1.2, DEFAULTS.settings.rate)
  settings.music = Boolean(settings.music)
  settings.narration = Boolean(settings.narration)
  settings.reduceMotion = Boolean(settings.reduceMotion)
  return settings
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function normalize(raw) {
  const progress = {}
  const source = raw?.progress
  if (source && typeof source === 'object') {
    for (const [storyId, entry] of Object.entries(source)) {
      if (!entry || typeof entry !== 'object') continue
      progress[storyId] = {
        sceneIndex: Math.max(0, Number(entry.sceneIndex) || 0),
        flags: entry.flags && typeof entry.flags === 'object' ? { ...entry.flags } : {},
        finished: Boolean(entry.finished),
        updatedAt: Number(entry.updatedAt) || 0,
        startedAt: Number(entry.startedAt) || 0,
      }
    }
  }
  return {
    settings: mergeSettings(raw?.settings),
    progress,
  }
}

export const store = reactive(normalize(readStorage()))

let saveTimer = null
let lastSerialized = ''

function persist() {
  try {
    const serialized = JSON.stringify(store)
    if (serialized === lastSerialized) return
    lastSerialized = serialized
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.warn('[little-explorers] 无法保存本地进度', error)
  }
}

watch(
  store,
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(persist, 250)
  },
  { deep: true },
)

// 页面关闭前尽量落盘一次
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist()
  })
}

export function getStoryProgress(storyId) {
  return store.progress[storyId] || null
}

export function saveStoryProgress(storyId, data) {
  const previous = store.progress[storyId] || {}
  store.progress[storyId] = {
    sceneIndex: Math.max(0, Number(data.sceneIndex) || 0),
    flags: { ...(data.flags || {}) },
    finished: Boolean(data.finished),
    startedAt: previous.startedAt || Date.now(),
    updatedAt: Date.now(),
  }
}

export function clearStoryProgress(storyId) {
  delete store.progress[storyId]
}

export function clearAllProgress() {
  store.progress = {}
}

export function updateSetting(key, value) {
  if (!(key in store.settings)) return
  store.settings[key] = value
}

export function resetSettings() {
  Object.assign(store.settings, DEFAULTS.settings)
}
