<template>
  <article class="story-card">
    <button class="story-card__cover" type="button" :aria-label="`打开《${story.title}》`" @click="open">
      <SceneArt
        class="story-card__art"
        :art="story.cover?.art || 'cover'"
        :flags="{}"
        :view-box="'0 0 1000 620'"
      />
      <span class="story-card__age">{{ story.ageEmoji }} {{ story.ageLabel }}</span>
      <span v-if="progressLabel" class="story-card__progress">{{ progressLabel }}</span>
      <span class="story-card__play" aria-hidden="true">▶</span>
    </button>

    <div class="story-card__body">
      <h3 class="story-card__title">{{ story.title }}</h3>
      <p class="story-card__subtitle">{{ story.subtitle }}</p>

      <ul class="story-card__chips" aria-label="故事主题">
        <li v-for="tag in (story.tags || []).slice(0, 3)" :key="tag">{{ tag }}</li>
      </ul>

      <p class="story-card__meta">
        <span aria-hidden="true">⏱</span> 约 {{ story.duration }} 分钟
        <span class="story-card__dot" aria-hidden="true">·</span>
        {{ (story.learning || [])[0] }}
      </p>

      <div class="story-card__actions">
        <button class="lx-btn lx-btn--primary" type="button" @click="open">
          <span aria-hidden="true">{{ hasProgress ? '▶' : '🎧' }}</span>
          {{ hasProgress ? '继续听' : '开始故事' }}
        </button>
        <button
          v-if="hasProgress || finished"
          class="lx-btn lx-btn--ghost"
          type="button"
          @click="$emit('open', { story, resume: false })"
        >
          从头开始
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import SceneArt from './art/SceneArt.vue'

const props = defineProps({
  story: { type: Object, required: true },
  progress: { type: Object, default: null },
})

const emit = defineEmits(['open'])

const finished = computed(() => Boolean(props.progress?.finished))
const hasProgress = computed(
  () => Boolean(props.progress) && !finished.value && Number(props.progress.sceneIndex) > 0,
)

const progressLabel = computed(() => {
  if (finished.value) return '已听完 🌟'
  if (hasProgress.value) return `继续听 · 第 ${Number(props.progress.sceneIndex) + 1} 页`
  return ''
})

function open() {
  emit('open', { story: props.story, resume: hasProgress.value || finished.value })
}
</script>

<style scoped>
.story-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 30px;
  background: var(--cream);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.9) inset,
    0 18px 40px rgba(88, 74, 66, 0.14);
  transition: transform 0.25s var(--ease-soft), box-shadow 0.25s var(--ease-soft);
}

.story-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.9) inset,
    0 26px 54px rgba(88, 74, 66, 0.2);
}

.story-card__cover {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: var(--paper-2);
  aspect-ratio: 16 / 10;
  cursor: pointer;
  overflow: hidden;
}

.story-card__art {
  display: block;
  width: 100%;
  height: 100%;
}

.story-card__age,
.story-card__progress {
  position: absolute;
  top: 14px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(6px);
}

.story-card__age {
  left: 14px;
  background: rgba(255, 253, 247, 0.92);
  color: var(--ink);
}

.story-card__progress {
  right: 14px;
  background: rgba(239, 139, 123, 0.94);
  color: #fff;
}

.story-card__play {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: clamp(56px, 6vw, 74px);
  height: clamp(56px, 6vw, 74px);
  padding-left: 4px;
  border-radius: 50%;
  background: rgba(255, 253, 247, 0.92);
  color: var(--coral);
  font-size: clamp(20px, 2.4vw, 28px);
  box-shadow: 0 12px 26px rgba(88, 74, 66, 0.22);
  transform: translate(-50%, -50%);
  transition: transform 0.25s var(--ease-bounce), background 0.25s ease;
}

.story-card__cover:hover .story-card__play,
.story-card__cover:focus-visible .story-card__play {
  transform: translate(-50%, -50%) scale(1.08);
  background: #fff;
}

.story-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: clamp(16px, 2vw, 24px);
}

.story-card__title {
  margin: 0;
  font-size: clamp(20px, 2.2vw, 26px);
  color: var(--ink);
}

.story-card__subtitle {
  margin: 0;
  font-size: clamp(13px, 1.4vw, 15px);
  color: var(--ink-2);
}

.story-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
}

.story-card__chips li {
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--paper-2);
  color: #8a6a4f;
  font-size: 12px;
}

.story-card__meta {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--ink-2);
}

.story-card__dot {
  margin: 0 4px;
}

.story-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.story-card__actions .lx-btn {
  flex: 1;
  min-width: 120px;
}
</style>
