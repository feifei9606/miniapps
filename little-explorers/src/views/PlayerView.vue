<template>
  <div class="player">
    <header class="player-top">
      <button class="lx-icon-btn home-btn" type="button" aria-label="回到书架" @click="exit">
        <span aria-hidden="true">🏠</span>
      </button>

      <div class="player-title">
        <span class="player-title__story">{{ story.shortTitle || story.title }}</span>
        <span class="player-title__scene">{{ scene.title }}</span>
      </div>

      <div class="dots" aria-hidden="true">
        <span
          v-for="dot in dots"
          :key="dot.index"
          class="dot"
          :class="{ 'is-current': dot.current, 'is-done': dot.done }"
        />
      </div>

      <button class="lx-icon-btn" type="button" aria-label="家长设置" @click="$emit('settings')">
        <span aria-hidden="true">⚙️</span>
      </button>
    </header>

    <main class="stage-wrap">
      <div class="stage">
        <SceneArt
          :art="scene.art"
          :flags="flags"
          :light="light"
          :fx="fx"
          :view-box="viewBox"
          @interact="handleInteract"
        />

        <transition name="bubble">
          <div v-if="bubble" class="speech-bubble" :style="bubbleStyle" role="status">
            {{ bubble.text }}
          </div>
        </transition>

        <transition name="fade">
          <div v-if="welcomeVisible && !finished" class="welcome-hint">
            {{ story.welcome }}
          </div>
        </transition>

        <transition name="fade">
          <div v-if="hintVisible && !gateOpen && !finished" class="gate-hint">
            {{ scene.gate?.hint }}
          </div>
        </transition>

        <transition name="fade">
          <p v-if="narrationText && !finished" class="caption" aria-live="polite">
            {{ narrationText }}
          </p>
        </transition>

      </div>
    </main>

    <transition name="fade">
      <EndingCard
        v-if="finished"
        :story="story"
        @replay="restart"
        @exit="exit"
      />
    </transition>

    <footer class="player-controls">
      <div class="controls-left">
        <button
          class="lx-icon-btn"
          type="button"
          :aria-label="store.settings.music ? '关闭背景音乐' : '打开背景音乐'"
          :aria-pressed="store.settings.music"
          @click="toggleMusic"
        >
          <span aria-hidden="true">{{ store.settings.music ? '🎵' : '🔇' }}</span>
        </button>
        <button
          class="lx-btn lx-btn--ghost replay-btn"
          type="button"
          :disabled="narrating || finished"
          @click="replay"
        >
          <span aria-hidden="true">🔊</span>
          <span class="replay-btn__text">再听一遍</span>
        </button>
      </div>

      <div class="controls-center">
        <button
          class="arrow"
          type="button"
          aria-label="上一页"
          :disabled="sceneIndex === 0 || finished"
          @click="goPrev"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <button
          class="continue-btn"
          :class="{ 'is-ready': canContinue && !finished }"
          type="button"
          :disabled="!canContinue || finished"
          @click="goNext"
        >
          <span>{{ isLast ? '故事结束啦' : '继续' }}</span>
          <span aria-hidden="true">➜</span>
        </button>

        <button
          class="arrow"
          type="button"
          aria-label="下一页"
          :disabled="!gateOpen || finished"
          @click="goNext"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div class="controls-right">
        <button class="lx-btn lx-btn--ghost parent-btn" type="button" @click="$emit('settings')">
          <span aria-hidden="true">⚙️</span>
          <span class="parent-btn__text">家长</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import SceneArt from '../components/art/SceneArt.vue'
import EndingCard from '../components/EndingCard.vue'
import { audio } from '../engine/audio'
import {
  clampScene,
  findInteraction,
  isGateOpen,
  narrationLines,
  progressDots,
  totalScenes,
} from '../engine/story-engine'
import { saveStoryProgress, store } from '../engine/progress'

const props = defineProps({
  story: { type: Object, required: true },
  initialScene: { type: Number, default: 0 },
  initialFlags: { type: Object, default: () => ({}) },
  autoplay: { type: Boolean, default: true },
})

const emit = defineEmits(['exit', 'settings'])

const sceneIndex = ref(clampScene(props.initialScene, props.story))
const flags = reactive({ ...props.initialFlags })
const released = ref(false)
const finished = ref(false)
const narrationText = ref('')
const narrationDone = ref(false)
const narrating = ref(false)
const light = ref('')
const bubble = ref(null)
const fx = ref('')
const hintVisible = ref(false)
const welcomeVisible = ref(false)
const viewBox = ref('0 0 1000 620')
const autoNarrate = ref(Boolean(props.autoplay))

let bubbleTimer = null
let fxTimer = null
let hintTimer = null
let releaseTimer = null
let welcomeTimer = null

const scene = computed(() => props.story.scenes[sceneIndex.value])
const total = computed(() => totalScenes(props.story))
const isLast = computed(() => sceneIndex.value >= total.value - 1)
const dots = computed(() => progressDots(props.story, sceneIndex.value))
const gateOpen = computed(() => isGateOpen(scene.value, flags, released.value))
const canContinue = computed(() => gateOpen.value && narrationDone.value)

const bubbleStyle = computed(() => {
  const at = bubble.value?.at
  if (!at) return { left: '50%', top: '24%' }
  const [vx, vy, vw, vh] = viewBox.value.split(' ').map(Number)
  const x = (((at.x / 100) * 1000 - vx) / vw) * 100
  const y = (((at.y / 100) * 620 - vy) / vh) * 100
  return {
    left: `${Math.min(88, Math.max(12, x))}%`,
    top: `${Math.min(84, Math.max(16, y))}%`,
  }
})

function updateViewBox() {
  viewBox.value = window.innerWidth < 760 ? '110 0 780 620' : '0 0 1000 620'
}

function clearTimers() {
  clearTimeout(bubbleTimer)
  clearTimeout(fxTimer)
  clearTimeout(hintTimer)
  clearTimeout(releaseTimer)
  clearTimeout(welcomeTimer)
}

function showBubble(item) {
  if (!item) return
  const at = item.at || null
  bubble.value = {
    text: item.bubble || item.speech || item.label || '',
    at,
    key: Date.now(),
  }
  clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => {
    bubble.value = null
  }, 3200)
}

function triggerFx(id) {
  fx.value = ''
  clearTimeout(fxTimer)
  requestAnimationFrame(() => {
    fx.value = id
    fxTimer = setTimeout(() => {
      fx.value = ''
    }, 950)
  })
}

// 有些场景没有单独定义某个零件的交互（比如别的画里没有车门），
// 这时退回整车交互，保证“点哪里都有回应”，不出现点了没反应的情况。
const PART_FALLBACK = { door: 'bus', wheel: 'bus', star: 'sun' }

function handleInteract(id) {
  if (finished.value) return
  const item = findInteraction(scene.value, id) || findInteraction(scene.value, PART_FALLBACK[id])
  if (!item) return

  if (item.flag) flags[item.flag] = true
  if (item.sfx) audio.playSfx(item.sfx)
  if (id === 'red' || id === 'yellow' || id === 'green') light.value = id

  triggerFx(id)
  showBubble(item)

  if (scene.value.gate && id === 'bear') {
    hintVisible.value = false
    clearTimeout(hintTimer)
    clearTimeout(releaseTimer)
  }

  if (item.speech) audio.speakShort(item.speech)
}

function armGate() {
  clearTimeout(hintTimer)
  clearTimeout(releaseTimer)
  hintVisible.value = false
  const gate = scene.value?.gate
  if (!gate) return
  if (gate.hintAfter) {
    hintTimer = setTimeout(() => {
      if (!isGateOpen(scene.value, flags, released.value)) hintVisible.value = true
    }, gate.hintAfter * 1000)
  }
  if (gate.releaseAfter) {
    releaseTimer = setTimeout(() => {
      if (isGateOpen(scene.value, flags, released.value)) return
      released.value = true
      hintVisible.value = false
      showBubble({ text: '我们一起去前面看看吧～' })
    }, gate.releaseAfter * 1000)
  }
}

function persist() {
  saveStoryProgress(props.story.id, {
    sceneIndex: sceneIndex.value,
    flags: { ...flags },
    finished: finished.value,
  })
}

async function startNarration() {
  const current = scene.value
  if (!current || finished.value) return
  const lines = narrationLines(current)
  if (!lines.length) {
    narrationDone.value = true
    return
  }

  narrating.value = true
  narrationDone.value = false
  narrationText.value = lines[0]?.text || ''

  const completed = await audio.narrate(lines, {
    rate: store.settings.rate,
    onLine(text) {
      if (scene.value === current) narrationText.value = text
    },
  })

  if (scene.value !== current) return
  narrating.value = false
  if (completed) {
    narrationDone.value = true
    if (current.gate && !isGateOpen(current, flags, released.value)) hintVisible.value = false
  }
}

function enterScene(index, { autoplay = autoNarrate.value, welcome = false } = {}) {
  audio.stopNarration()
  clearTimeout(bubbleTimer)
  clearTimeout(welcomeTimer)
  bubble.value = null
  fx.value = ''
  hintVisible.value = false
  released.value = false
  finished.value = false
  narrationText.value = ''
  narrationDone.value = false
  narrating.value = false

  sceneIndex.value = clampScene(index, props.story)
  const current = scene.value
  light.value = current?.art === 'traffic-light' ? 'red' : ''

  welcomeVisible.value = Boolean(welcome)
  if (welcome) {
    welcomeTimer = setTimeout(() => {
      welcomeVisible.value = false
    }, 8000)
  }

  persist()
  armGate()

  if (autoplay && store.settings.narration) {
    // 等场景渲染一帧，再开始播放旁白
    setTimeout(() => {
      if (scene.value === current && !finished.value) startNarration()
    }, 280)
  } else {
    narrationDone.value = true
    narrationText.value = narrationLines(current)[0]?.text || ''
  }
}

function replay() {
  if (narrating.value || finished.value) return
  audio.stopNarration()
  startNarration()
}

function goNext() {
  if (finished.value) return
  if (!gateOpen.value) {
    hintVisible.value = true
    audio.playSfx('click')
    return
  }
  if (isLast.value) {
    finishStory()
    return
  }
  audio.playSfx('page')
  enterScene(sceneIndex.value + 1)
}

function goPrev() {
  if (sceneIndex.value === 0 || finished.value) return
  audio.playSfx('page')
  enterScene(sceneIndex.value - 1)
}

function finishStory() {
  audio.stopNarration()
  audio.playSfx('chime')
  finished.value = true
  persist()
  audio.speakShort(props.story.ending?.cheer || '')
}

function restart() {
  for (const key of Object.keys(flags)) delete flags[key]
  audio.stopNarration()
  finished.value = false
  enterScene(0, { welcome: false })
}

function exit() {
  persist()
  audio.stopNarration()
  emit('exit')
}

function toggleMusic() {
  store.settings.music = !store.settings.music
}

function onKeydown(event) {
  if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return
  if (event.key === 'ArrowRight') goNext()
  else if (event.key === 'ArrowLeft') goPrev()
  else if (event.key === ' ' && !narrating.value) {
    event.preventDefault()
    replay()
  }
}

watch(
  flags,
  () => {
    persist()
    if (scene.value?.gate && flags[scene.value.gate.flag]) {
      hintVisible.value = false
      clearTimeout(hintTimer)
      clearTimeout(releaseTimer)
    }
  },
  { deep: true },
)

watch(
  () => store.settings.music,
  (enabled) => {
    audio.setMusicEnabled(enabled)
    if (enabled && !audio.isUnlocked) audio.unlock()
    if (enabled) audio.startMusic()
  },
)

watch(
  () => store.settings.volume,
  (volume) => audio.setVolume(volume),
)

watch(
  () => store.settings.narration,
  (enabled) => audio.setNarrationEnabled(enabled),
)

watch(
  () => store.settings.rate,
  (rate) => audio.setRate(rate),
)

onMounted(() => {
  updateViewBox()
  window.addEventListener('resize', updateViewBox)
  window.addEventListener('keydown', onKeydown)

  audio.setVolume(store.settings.volume)
  audio.setNarrationEnabled(store.settings.narration)
  audio.setRate(store.settings.rate)
  audio.setMusicEnabled(store.settings.music)
  if (store.settings.music && audio.isUnlocked) audio.startMusic()

  enterScene(sceneIndex.value, { autoplay: props.autoplay, welcome: sceneIndex.value === 0 && !props.initialScene })
})

onBeforeUnmount(() => {
  clearTimers()
  audio.stopNarration()
  audio.stopMusic()
  window.removeEventListener('resize', updateViewBox)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.player {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: 12px clamp(12px, 3vw, 34px) 16px;
  gap: 10px;
  background:
    radial-gradient(circle at 12% 8%, rgba(247, 198, 75, 0.22), transparent 34%),
    radial-gradient(circle at 88% 4%, rgba(166, 216, 233, 0.3), transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(168, 211, 154, 0.22), transparent 42%),
    var(--paper);
}

.player-top {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
}

.home-btn {
  flex: none;
}

.player-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.player-title__story {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--ink-2);
}

.player-title__scene {
  font-size: clamp(16px, 2vw, 21px);
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dots {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: none;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e6d8c6;
  transition: all 0.3s var(--ease-soft);
}

.dot.is-done {
  background: var(--sun);
}

.dot.is-current {
  width: 22px;
  border-radius: 8px;
  background: var(--coral);
}

.stage-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.stage {
  position: relative;
  width: min(1120px, 100%, calc((100dvh - 200px) * 1.6));
  aspect-ratio: 16 / 10;
  border-radius: clamp(20px, 2.4vw, 34px);
  overflow: hidden;
  background: var(--paper-2);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.7) inset,
    0 26px 60px rgba(88, 74, 66, 0.18),
    0 6px 18px rgba(88, 74, 66, 0.08);
}

.speech-bubble {
  position: absolute;
  transform: translate(-50%, -112%);
  max-width: min(440px, 66%);
  padding: 10px 20px;
  border-radius: 22px;
  border: 3px solid var(--sun);
  background: var(--cream);
  color: var(--ink);
  font-size: clamp(16px, 1.8vw, 23px);
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  box-shadow: 0 12px 26px rgba(88, 74, 66, 0.18);
  pointer-events: none;
  z-index: 6;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -12px;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 12px solid var(--sun);
}

.welcome-hint,
.gate-hint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: min(760px, 84%);
  padding: 10px 22px;
  border-radius: 999px;
  background: rgba(255, 253, 247, 0.94);
  color: var(--ink-2);
  font-size: clamp(13px, 1.5vw, 17px);
  text-align: center;
  box-shadow: 0 8px 20px rgba(88, 74, 66, 0.12);
  z-index: 5;
  pointer-events: none;
}

.welcome-hint {
  top: 16px;
}

.gate-hint {
  bottom: 88px;
  color: #a86b4f;
  animation: hint-pulse 2.4s ease-in-out infinite;
}

.caption {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  max-width: min(820px, 88%);
  margin: 0;
  padding: 8px 22px;
  border-radius: 18px;
  background: rgba(255, 253, 247, 0.9);
  color: var(--ink);
  font-size: clamp(14px, 1.6vw, 20px);
  line-height: 1.5;
  text-align: center;
  box-shadow: 0 8px 20px rgba(88, 74, 66, 0.1);
  z-index: 4;
}

.player-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.controls-right {
  justify-content: flex-end;
}

.controls-center {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.4vw, 16px);
  flex: none;
}

.arrow {
  display: grid;
  place-items: center;
  width: clamp(46px, 4.6vw, 58px);
  height: clamp(46px, 4.6vw, 58px);
  padding: 0 0 4px;
  border: none;
  border-radius: 50%;
  background: var(--cream);
  color: var(--ink);
  font-size: clamp(26px, 3vw, 34px);
  line-height: 1;
  box-shadow: 0 6px 0 #e8d8c2, 0 10px 20px rgba(88, 74, 66, 0.12);
  cursor: pointer;
  transition: transform 0.15s var(--ease-soft), box-shadow 0.15s var(--ease-soft);
}

.arrow:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow: 0 3px 0 #e8d8c2;
}

.arrow:disabled {
  opacity: 0.35;
  cursor: default;
  box-shadow: none;
}

.continue-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: clamp(150px, 18vw, 200px);
  height: clamp(52px, 5vw, 62px);
  padding: 0 26px;
  border: none;
  border-radius: 999px;
  background: #ece0cf;
  color: #b3a292;
  font-family: inherit;
  font-size: clamp(17px, 1.9vw, 21px);
  font-weight: 700;
  cursor: default;
  transition: all 0.25s var(--ease-soft);
}

.continue-btn.is-ready {
  background: linear-gradient(180deg, #b7dfa9, #7fbc84);
  color: #2f4a38;
  cursor: pointer;
  box-shadow: 0 7px 0 #5f9e70, 0 14px 26px rgba(95, 158, 112, 0.28);
  animation: continue-pulse 2.2s ease-in-out infinite;
}

.continue-btn.is-ready:active {
  transform: translateY(3px);
  box-shadow: 0 4px 0 #5f9e70;
}

.replay-btn {
  gap: 8px;
}

@media (max-width: 760px) {
  .player {
    padding: 8px 10px 12px;
    gap: 6px;
  }

  .stage {
    width: 100%;
    aspect-ratio: 4 / 3;
  }

  .player-controls {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .controls-center {
    order: 1;
    width: 100%;
    justify-content: center;
  }

  .controls-left {
    order: 2;
    justify-content: flex-end;
    flex: none;
  }

  .controls-right {
    order: 3;
    justify-content: flex-start;
    flex: none;
  }

  .dots {
    display: none;
  }

  .replay-btn__text,
  .parent-btn__text {
    display: none;
  }

  .caption {
    bottom: 8px;
    max-width: 94%;
    padding: 6px 14px;
  }

  .gate-hint {
    bottom: 64px;
  }
}

@keyframes continue-pulse {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes hint-pulse {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 1;
    box-shadow: 0 8px 26px rgba(239, 139, 123, 0.3);
  }
}
</style>
