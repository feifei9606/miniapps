<template>
  <div class="app" :class="{ 'reduce-motion': store.settings.reduceMotion }">
    <DevSheet v-if="view === 'sheet'" :story="stories[0]" @exit="exitSheet" />

    <PlayerView
      v-else-if="currentStory"
      :key="playerKey"
      :story="currentStory"
      :initial-scene="initialScene"
      :initial-flags="initialFlags"
      :autoplay="autoplay"
      @exit="closePlayer"
      @settings="showSettings = true"
    />

    <LibraryView v-else @open="openStory" @settings="showSettings = true" />

    <ParentSettings v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DevSheet from './components/DevSheet.vue'
import ParentSettings from './components/ParentSettings.vue'
import LibraryView from './views/LibraryView.vue'
import PlayerView from './views/PlayerView.vue'
import { getStory, stories } from './data/stories'
import { audio } from './engine/audio'
import { clearStoryProgress, getStoryProgress, store } from './engine/progress'

const view = ref('library')
const currentStory = ref(null)
const initialScene = ref(0)
const initialFlags = ref({})
const autoplay = ref(true)
const showSettings = ref(false)
const playerKey = ref(0)
const unlocked = ref(false)

function syncUrl() {
  history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
}

function parseDeepLink() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('view') === 'sheet') {
    view.value = 'sheet'
    return
  }

  const storyId = params.get('story')
  if (!storyId) return

  const story = getStory(storyId)
  if (!story) return

  currentStory.value = story
  initialScene.value = Math.max(0, Number(params.get('scene') || 0))
  initialFlags.value = {}
  autoplay.value = params.get('narration') !== '0'
  playerKey.value += 1
  view.value = 'player'
}

function unlockAudio() {
  if (unlocked.value) return
  unlocked.value = true
  audio.unlock()
  if (currentStory.value && store.settings.music) audio.startMusic()
}

function openStory({ story, resume = false }) {
  if (!story) return
  const saved = getStoryProgress(story.id)

  if (resume && saved && !saved.finished) {
    initialScene.value = Number(saved.sceneIndex) || 0
    initialFlags.value = { ...(saved.flags || {}) }
  } else {
    clearStoryProgress(story.id)
    initialScene.value = 0
    initialFlags.value = {}
  }

  currentStory.value = story
  autoplay.value = true
  playerKey.value += 1
  view.value = 'player'
  syncUrl()
}

function closePlayer() {
  currentStory.value = null
  view.value = 'library'
  syncUrl()
}

function exitSheet() {
  view.value = 'library'
  syncUrl()
}

function onFirstPointer() {
  unlockAudio()
}

watch(
  () => store.settings.reduceMotion,
  (reduce) => {
    document.documentElement.classList.toggle('reduce-motion', reduce)
  },
  { immediate: true },
)

onMounted(() => {
  audio.refreshVoices()
  parseDeepLink()
  window.addEventListener('pointerdown', onFirstPointer, { once: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onFirstPointer)
})
</script>

<style scoped>
.app {
  min-height: 100dvh;
  background:
    radial-gradient(circle at 8% 4%, rgba(247, 198, 75, 0.18), transparent 30%),
    radial-gradient(circle at 94% 8%, rgba(166, 216, 233, 0.24), transparent 28%),
    var(--paper);
}

@keyframes hint-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style>
