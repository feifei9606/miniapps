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

      <div class="progress" :aria-label="progressLabel" role="img">
        <span class="progress__fill" :style="{ width: `${progressPercent}%` }" />
      </div>

      <button class="lx-icon-btn" type="button" aria-label="家长设置" @click="$emit('settings')">
        <span aria-hidden="true">⚙️</span>
      </button>
    </header>

    <main class="stage-wrap">
      <div ref="stageEl" class="stage" :class="{ 'is-choice': isChoice }">
        <SceneArt
          :art="scene.art"
          :vehicle="vehicleName"
          :flags="flags"
          :light="light"
          :fx="fx"
          :view-box="viewBox"
          @interact="handleInteract"
        />

        <!-- 选择页：画面本身就是选项，孩子直接点大卡片 -->
        <transition name="choice">
          <section v-if="isChoice && !finished" class="choice-panel">
            <p class="choice-prompt">{{ scene.prompt }}</p>
            <div class="choice-grid">
              <button
                v-for="choice in scene.choices"
                :key="choice.id"
                class="choice-card"
                :class="{
                  'is-picked': pickedId === choice.id,
                  'is-dimmed': pickedId && pickedId !== choice.id,
                }"
                type="button"
                :disabled="Boolean(pickedId)"
                :aria-label="`${choice.label}：${choice.hint || ''}`"
                @click="pick(choice)"
              >
                <span class="choice-card__art">
                  <ChoiceArt :art="choice.art" :label="choice.label" />
                </span>
                <span class="choice-card__body">
                  <span class="choice-card__label">
                    <span aria-hidden="true">{{ choice.emoji }}</span>
                    {{ choice.label }}
                  </span>
                  <span v-if="choice.hint" class="choice-card__hint">{{ choice.hint }}</span>
                </span>
              </button>
            </div>
          </section>
        </transition>

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
          <p v-if="narrationText && !finished && !isChoice" class="caption" aria-live="polite">
            {{ narrationText }}
          </p>
        </transition>
      </div>
    </main>

    <transition name="fade">
      <EndingCard
        v-if="finished"
        :story="story"
        :vars="vars"
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
          :disabled="stepIndex === 0 || finished"
          @click="goPrev"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <button
          v-if="!isChoice"
          class="continue-btn"
          :class="{ 'is-ready': canContinue && !finished }"
          type="button"
          :disabled="!canContinue || finished"
          @click="goNext"
        >
          <span>{{ hasNext ? '继续' : '故事结束啦' }}</span>
          <span aria-hidden="true">➜</span>
        </button>

        <button
          class="arrow"
          type="button"
          aria-label="下一页"
          :disabled="isChoice || !gateOpen || finished"
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
import ChoiceArt from '../components/art/ChoiceArt.vue'
import SceneArt from '../components/art/SceneArt.vue'
import EndingCard from '../components/EndingCard.vue'
import { audio } from '../engine/audio'
import {
  choiceOutcome,
  findInteraction,
  isChoiceScene,
  isGateOpen,
  narrationLines,
  resolveNext,
  sceneById,
  sceneIndexById,
  storyScenes,
} from '../engine/story-engine'
import { saveStoryProgress, store } from '../engine/progress'

const props = defineProps({
  story: { type: Object, required: true },
  initialScene: { type: Number, default: 0 },
  initialFlags: { type: Object, default: () => ({}) },
  initialVars: { type: Object, default: () => ({}) },
  autoplay: { type: Boolean, default: true },
})

const emit = defineEmits(['exit', 'settings'])

const scenes = computed(() => storyScenes(props.story))
const firstScene = computed(() => scenes.value[0] || { id: '', art: 'cover', title: '' })

function initialSceneId() {
  const byIndex = scenes.value[Math.max(0, Number(props.initialScene) || 0)]
  return (byIndex || firstScene.value).id
}

const sceneId = ref(initialSceneId())
const flags = reactive({ ...props.initialFlags })
// 剧情变量：vehicle / route / ending …… 由选择页写入，用来决定台词、场景和结尾
const vars = reactive({ ...(props.story.vars || {}), ...props.initialVars })
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
const stageEl = ref(null)
const viewBox = ref('0 0 1000 620')
const autoNarrate = ref(Boolean(props.autoplay))
const pickedId = ref('')

let bubbleTimer = null
let fxTimer = null
let hintTimer = null
let releaseTimer = null
let welcomeTimer = null
let pickTimer = null

const scene = computed(() => sceneById(props.story, sceneId.value) || firstScene.value)
const isChoice = computed(() => isChoiceScene(scene.value))
const vehicleName = computed(() => vars.vehicle || 'bus')
const gateOpen = computed(() => isGateOpen(scene.value, flags, released.value))
const canContinue = computed(() => gateOpen.value && narrationDone.value)
const nextId = computed(() =>
  isChoice.value ? null : resolveNext(scene.value, vars, flags),
)
const hasNext = computed(() => Boolean(nextId.value))

// 走过的页（用于“上一页”和页数圆点）。分支故事不能靠下标回退，
// 所以记一条真实走过的路径。
const history = ref([sceneId.value])

/**
 * 从当前页往后还能走几页（选择页按第一个选项估算），
 * 只用于显示进度圆点的总数，不影响真实跳转。
 */
const stepsAhead = computed(() => {
  const ids = []
  const seen = new Set()
  let current = scene.value
  let guard = 0
  while (current && guard < 20) {
    const next = isChoiceScene(current)
      ? current.choices?.[0]?.next
      : resolveNext(current, vars, flags)
    if (!next || seen.has(next)) break
    seen.add(next)
    const target = sceneById(props.story, next)
    if (!target) break
    ids.push(target.id)
    current = target
    guard += 1
  }
  return ids
})

const stepIndex = computed(() => Math.max(0, history.value.length - 1))
const estTotal = computed(() => history.value.length + stepsAhead.value.length)
const progressPercent = computed(() =>
  Math.min(100, Math.max(4, Math.round((history.value.length / Math.max(1, estTotal.value)) * 100))),
)
const progressLabel = computed(
  () => `故事进度 ${stepIndex.value + 1} / ${estTotal.value}`,
)

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

/**
 * 按舞台自身的宽高比决定取景框，而不是按窗口宽度。
 * 手机横屏时窗口很宽（>760），但舞台不一定宽；竖屏时舞台窄，要裁掉两侧空白把画面放大。
 */
function updateViewBox() {
  const el = stageEl.value
  const width = el?.clientWidth || window.innerWidth
  const height = el?.clientHeight || Math.round(width / 1.6)
  viewBox.value = width / Math.max(1, height) >= 1.45 ? '0 0 1000 620' : '110 0 780 620'
}

function clearTimers() {
  clearTimeout(bubbleTimer)
  clearTimeout(fxTimer)
  clearTimeout(hintTimer)
  clearTimeout(releaseTimer)
  clearTimeout(welcomeTimer)
  clearTimeout(pickTimer)
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
  if (finished.value || isChoice.value) return
  const item = findInteraction(scene.value, id) || findInteraction(scene.value, PART_FALLBACK[id])
  if (!item) return

  if (item.flag) flags[item.flag] = true
  if (item.sfx) audio.playSfx(item.sfx)
  if (id === 'red' || id === 'yellow' || id === 'green') light.value = id

  triggerFx(id)
  showBubble(item)

  if (scene.value.gate) {
    hintVisible.value = false
  }

  if (item.speech) audio.speakShort(item.speech)
}

/**
 * 点选择卡：先给即时反馈（卡片放大 + 音效 + 一句旁白），
 * 再把变量写进故事状态，随后跳到下一页。
 */
function pick(choice) {
  if (pickedId.value || finished.value) return

  pickedId.value = choice.id
  if (choice.sfx) audio.playSfx(choice.sfx)
  showBubble({ text: choice.speech || choice.label })

  const outcome = choiceOutcome(choice, vars)
  Object.assign(vars, outcome.vars)
  if (choice.set?.vehicle) flags.vehicle = choice.set.vehicle
  if (choice.set?.route) flags.route = choice.set.route
  if (choice.set?.ending) flags.ending = choice.set.ending

  persist()

  if (choice.speech) audio.speakShort(choice.speech)

  clearTimeout(pickTimer)
  pickTimer = setTimeout(() => {
    pickedId.value = ''
    if (outcome.next) enterScene(outcome.next)
  }, 1150)
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
    sceneIndex: sceneIndexById(props.story, sceneId.value),
    flags: { ...flags },
    vars: { ...vars },
    finished: finished.value,
  })
}

async function startNarration() {
  const current = scene.value
  if (!current || finished.value) return
  const lines = narrationLines(current, vars)
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

function enterScene(id, { autoplay = autoNarrate.value, welcome = false, trail = true } = {}) {
  audio.stopNarration()
  clearTimeout(bubbleTimer)
  clearTimeout(welcomeTimer)
  clearTimeout(pickTimer)
  bubble.value = null
  fx.value = ''
  pickedId.value = ''
  hintVisible.value = false
  released.value = false
  finished.value = false
  narrationText.value = ''
  narrationDone.value = false
  narrating.value = false

  sceneId.value = sceneById(props.story, id) ? id : firstScene.value.id
  const current = scene.value
  light.value = current?.art === 'traffic-light' ? 'red' : ''

  if (trail) {
    // 往回走时把后面的记录截掉，再记上当前页，避免路径越堆越长
    const at = history.value.indexOf(sceneId.value)
    if (at >= 0) history.value = history.value.slice(0, at + 1)
    else history.value = [...history.value, sceneId.value]
  }

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
    narrationText.value = narrationLines(current, vars)[0]?.text || ''
  }
}

function replay() {
  if (narrating.value || finished.value) return
  audio.stopNarration()
  startNarration()
}

function goNext() {
  if (finished.value || isChoice.value) return
  if (!gateOpen.value) {
    hintVisible.value = true
    audio.playSfx('click')
    return
  }
  if (!nextId.value) {
    finishStory()
    return
  }
  audio.playSfx('page')
  enterScene(nextId.value)
}

function goPrev() {
  if (stepIndex.value === 0 || finished.value) return
  const previous = history.value[history.value.length - 2]
  if (!previous) return
  audio.playSfx('page')
  enterScene(previous, { trail: false })
  history.value = history.value.slice(0, -1)
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
  // 重新开始时清空剧情变量，让孩子可以走另一条路
  for (const key of Object.keys(vars)) delete vars[key]
  Object.assign(vars, props.story.vars || {})
  audio.stopNarration()
  finished.value = false
  enterScene(firstScene.value.id, { welcome: false })
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
    if (scene.value?.gate) {
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

let stageObserver = null

onMounted(() => {
  updateViewBox()
  if (typeof ResizeObserver !== 'undefined' && stageEl.value) {
    stageObserver = new ResizeObserver(updateViewBox)
    stageObserver.observe(stageEl.value)
  }
  window.addEventListener('resize', updateViewBox)
  window.addEventListener('keydown', onKeydown)

  audio.setVolume(store.settings.volume)
  audio.setNarrationEnabled(store.settings.narration)
  audio.setRate(store.settings.rate)
  audio.setMusicEnabled(store.settings.music)
  if (store.settings.music && audio.isUnlocked) audio.startMusic()

  enterScene(sceneId.value, {
    autoplay: props.autoplay,
    welcome: sceneId.value === firstScene.value.id && !props.initialScene,
  })
})

onBeforeUnmount(() => {
  clearTimers()
  audio.stopNarration()
  audio.stopMusic()
  window.removeEventListener('resize', updateViewBox)
  window.removeEventListener('keydown', onKeydown)
  stageObserver?.disconnect()
  stageObserver = null
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

.progress {
  position: relative;
  flex: none;
  width: clamp(70px, 12vw, 132px);
  height: 8px;
  border-radius: 999px;
  background: #ecdfcc;
  overflow: hidden;
}

.progress__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--sun), var(--coral));
  transition: width 0.45s var(--ease-soft);
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

/* ---------------- 选择页 ---------------- */

.choice-panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 1.4vw, 16px);
  padding: clamp(14px, 2.4vw, 30px) clamp(14px, 3vw, 40px) clamp(56px, 6vw, 74px);
  background: linear-gradient(180deg, rgba(255, 251, 243, 0.9), rgba(255, 245, 231, 0.88));
  z-index: 7;
}

.choice-prompt {
  margin: 0;
  padding: 8px 24px;
  border-radius: 999px;
  background: rgba(255, 253, 247, 0.95);
  color: var(--ink);
  font-size: clamp(15px, 1.9vw, 23px);
  font-weight: 700;
  text-align: center;
  box-shadow: 0 10px 24px rgba(88, 74, 66, 0.14);
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 2vw, 26px);
  width: min(720px, 100%);
}

.choice-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: clamp(10px, 1.4vw, 18px) clamp(10px, 1.4vw, 18px) clamp(8px, 1.1vw, 14px);
  border: 4px solid #fff;
  border-radius: clamp(20px, 2.4vw, 30px);
  background: var(--cream);
  color: var(--ink);
  font-family: inherit;
  cursor: pointer;
  box-shadow:
    0 6px 0 #eadac2,
    0 18px 30px rgba(88, 74, 66, 0.16);
  transition:
    transform 0.18s var(--ease-soft),
    box-shadow 0.18s var(--ease-soft),
    opacity 0.28s ease;
  animation: card-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.choice-card:nth-child(2) {
  animation-delay: 0.1s;
}

.choice-card__art {
  display: block;
  width: 100%;
  overflow: hidden;
  border-radius: clamp(14px, 1.8vw, 22px);
}

.choice-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.choice-card__label {
  font-size: clamp(15px, 1.9vw, 22px);
  font-weight: 700;
}

.choice-card__hint {
  font-size: clamp(11px, 1.3vw, 15px);
  color: var(--ink-2);
}

.choice-card:hover:not(:disabled),
.choice-card:focus-visible:not(:disabled) {
  transform: translateY(-4px);
}

.choice-card:focus-visible:not(:disabled) {
  outline: none;
  box-shadow:
    0 6px 0 #eadac2,
    0 0 0 5px rgba(247, 198, 75, 0.55),
    0 18px 30px rgba(88, 74, 66, 0.16);
}

.choice-card:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #eadac2;
}

.choice-card.is-picked {
  animation: card-pick 0.5s ease both;
  border-color: var(--sun);
}

.choice-card.is-dimmed {
  opacity: 0.45;
  transform: scale(0.96);
}

.choice-enter-active,
.choice-leave-active {
  transition: opacity 0.35s ease, transform 0.35s var(--ease-soft);
}

.choice-enter-from,
.choice-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* ---------------- 其它 ---------------- */

.speech-bubble {
  position: absolute;
  /* 气泡、提示都只是说明文字，不能挡住下面的可点物体 */
  pointer-events: none;
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
  z-index: 8;
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
  pointer-events: none;
}

.gate-hint {
  bottom: 88px;
  pointer-events: none;
  color: #a86b4f;
  animation: hint-pulse 2.4s ease-in-out infinite;
}

.caption {
  position: absolute;
  left: 50%;
  bottom: 14px;
  /* 字幕只负责显示，不要挡住下面的可点物体 */
  pointer-events: none;
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

  /* 选择页没有画面可看，让舞台长高一点，卡片才不会挤在中间一小条里 */
  .stage.is-choice {
    aspect-ratio: auto;
    min-height: min(62dvh, 460px);
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

  .progress {
    width: 64px;
  }

  .choice-panel {
    padding: 10px 10px 46px;
    gap: 8px;
  }

  .choice-grid {
    gap: 10px;
  }

  .choice-card {
    padding: 8px 8px 6px;
    border-width: 3px;
    border-radius: 18px;
  }

  .choice-prompt {
    padding: 6px 16px;
    font-size: 14px;
  }

  .choice-card__hint {
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

/* ===== 手机横屏：高度才是瓶颈，把上下留白和按钮都压紧，舞台尽量撑满 ===== */
@media (orientation: landscape) and (max-height: 560px) {
  .player {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
    padding: 6px 10px;
    gap: 4px;
  }

  .player-top {
    flex: none;
    gap: 8px;
  }

  .player-top .lx-icon-btn {
    width: 38px;
    height: 38px;
    font-size: 17px;
  }

  .player-title__story {
    display: none;
  }

  .player-title__scene {
    font-size: 15px;
  }

  .stage-wrap {
    flex: 1;
    min-height: 0;
  }

  /* 高度决定画面大小：保持绘本比例，横屏下宽出来的是留白而不是裁切 */
  .stage {
    width: auto;
    height: 100%;
    max-width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 18px;
  }

  /* 选择页没有画面，直接铺满整块舞台 */
  .stage.is-choice {
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
    min-height: 0;
  }

  .player-controls {
    flex: none;
    flex-wrap: nowrap;
    gap: 8px;
  }

  .controls-center {
    order: 0;
    width: auto;
  }

  .arrow {
    width: 40px;
    height: 40px;
    font-size: 22px;
  }

  .continue-btn {
    min-width: 128px;
    height: 42px;
    padding: 0 20px;
    font-size: 16px;
  }

  .progress {
    width: 90px;
  }

  .caption {
    bottom: 6px;
    max-width: 76%;
    padding: 4px 12px;
    font-size: 13px;
  }

  .gate-hint {
    bottom: 50px;
    padding: 6px 16px;
    font-size: 13px;
  }

  .welcome-hint {
    top: 8px;
    padding: 6px 16px;
    font-size: 13px;
  }

  /* 两张选择卡横过来：左图右字，矮屏也能占到足够高度 */
  .choice-panel {
    padding: 8px 10px;
    gap: 8px;
  }

  .choice-prompt {
    padding: 4px 16px;
    font-size: 15px;
  }

  .choice-grid {
    gap: 10px;
    width: 100%;
  }

  .choice-card {
    flex-direction: row;
    align-items: center;
    text-align: left;
    gap: 10px;
    padding: 6px 12px 6px 6px;
    border-width: 3px;
    border-radius: 18px;
  }

  .choice-card__art {
    width: 46%;
    flex: none;
    border-radius: 12px;
  }

  .choice-card__body {
    flex: 1;
    align-items: flex-start;
    gap: 3px;
  }

  .choice-card__label {
    font-size: 15px;
  }

  .choice-card__hint {
    display: block;
    font-size: 12px;
    line-height: 1.35;
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

@keyframes card-pop {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes card-pick {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.07);
  }
  100% {
    transform: scale(1.03);
  }
}
</style>
