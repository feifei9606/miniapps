<template>
  <div class="library">
    <header class="library-top">
      <div class="brand">
        <span class="brand__mark" aria-hidden="true">🌙</span>
        <div class="brand__text">
          <h1 class="brand__name">小小探险家</h1>
          <p class="brand__tag">Little Explorers · 听故事、玩一玩、发现世界</p>
        </div>
      </div>

      <button class="lx-btn lx-btn--ghost library-top__settings" type="button" @click="$emit('settings')">
        <span aria-hidden="true">⚙️</span>
        <span class="library-top__settings-text">家长</span>
      </button>
    </header>

    <section class="hero">
      <div class="hero__copy">
        <p class="hero__eyebrow">今天的故事</p>
        <h2 class="hero__title">今天想去哪里玩呢？</h2>
        <p class="hero__sub">
          点一点大图片，选一个故事。<br />
          嘟嘟会带你出发，路上的东西都可以点一点。
        </p>
        <div class="hero__actions">
          <button class="lx-btn lx-btn--primary hero__start" type="button" @click="openFirst">
            <span aria-hidden="true">🎧</span> 开始故事
          </button>
          <span class="hero__hint">第一次点一下，声音才会出来哦</span>
        </div>
      </div>

      <div class="hero__art" aria-hidden="true">
        <div class="hero__frame">
          <SceneArt art="cover" :flags="{}" view-box="0 0 1000 620" />
        </div>
        <span class="hero__sticker hero__sticker--one">🚌</span>
        <span class="hero__sticker hero__sticker--two">🌈</span>
      </div>
    </section>

    <div class="age-filter" role="group" aria-label="按年龄筛选故事">
      <button
        v-for="age in AGE_FILTERS"
        :key="age.id"
        class="age-pill"
        :class="{ 'is-active': store.settings.ageFilter === age.id }"
        type="button"
        :aria-pressed="store.settings.ageFilter === age.id"
        @click="setAge(age.id)"
      >
        <span aria-hidden="true">{{ age.emoji }}</span>
        <span class="age-pill__full">{{ age.label }}</span>
        <span class="age-pill__short">{{ age.short }}</span>
      </button>
    </div>

    <section class="shelf" aria-label="故事书架">
      <div class="shelf__head">
        <h2 class="shelf__title">故事书架</h2>
        <p class="shelf__count">{{ filteredStories.length }} 个故事 · 可以反复玩</p>
      </div>

      <div class="shelf__grid">
        <StoryCard
          v-for="story in filteredStories"
          :key="story.id"
          :story="story"
          :progress="progressFor(story)"
          @open="openStory"
        />

        <article v-for="item in filteredComingSoon" :key="item.id" class="coming-card" :style="comingStyle(item)">
          <div class="coming-card__art" aria-hidden="true">
            <span class="coming-card__emoji">{{ item.emoji }}</span>
            <span class="coming-card__cloud coming-card__cloud--a" />
            <span class="coming-card__cloud coming-card__cloud--b" />
          </div>
          <div class="coming-card__body">
            <span class="coming-card__badge">马上就来</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.subtitle }}</p>
            <p class="coming-card__age">{{ item.ageLabel }}</p>
          </div>
        </article>
      </div>

      <p v-if="!filteredStories.length && !filteredComingSoon.length" class="shelf__empty">
        这个年龄的故事正在准备中，先看看别的吧～
      </p>
    </section>

    <section class="how" aria-label="怎么玩">
      <h2 class="how__title">怎么玩？</h2>
      <ol class="how__steps">
        <li class="how__step">
          <span class="how__num">1</span>
          <span class="how__emoji" aria-hidden="true">👆</span>
          <strong>点一点</strong>
          <span>画面里的太阳、车轮、小动物都可以点。</span>
        </li>
        <li class="how__step">
          <span class="how__num">2</span>
          <span class="how__emoji" aria-hidden="true">👂</span>
          <strong>听一听</strong>
          <span>每一页都会慢慢讲故事，听完再继续。</span>
        </li>
        <li class="how__step">
          <span class="how__num">3</span>
          <span class="how__emoji" aria-hidden="true">➜</span>
          <strong>继续走</strong>
          <span>绿色的“继续”按钮亮起来，就翻到下一页。</span>
        </li>
      </ol>
    </section>

    <footer class="library-foot">
      <p>没有广告，也没有账号。故事进度只保存在这台设备上。</p>
      <p class="library-foot__small">
        旁白由浏览器语音朗读，第一次点“开始故事”后才会响。建议使用平板或电脑，音量适中。
      </p>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SceneArt from '../components/art/SceneArt.vue'
import StoryCard from '../components/StoryCard.vue'
import { AGE_FILTERS, COMING_SOON } from '../data/categories'
import { stories } from '../data/stories'
import { store, updateSetting } from '../engine/progress'

const emit = defineEmits(['open', 'settings'])

const activeAge = computed(() => AGE_FILTERS.find((age) => age.id === store.settings.ageFilter) || AGE_FILTERS[0])

function overlaps(range, storyRange) {
  if (!range) return true
  return storyRange[0] <= range[1] && storyRange[1] >= range[0]
}

const filteredStories = computed(() =>
  stories.filter((story) => overlaps(activeAge.value.range, story.ageRange || [2, 5])),
)

const filteredComingSoon = computed(() =>
  COMING_SOON.filter((item) => overlaps(activeAge.value.range, item.ageRange || [2, 5])),
)

function progressFor(story) {
  return store.progress?.[story.id] || null
}

function setAge(id) {
  updateSetting('ageFilter', id)
}

function openStory(payload) {
  emit('open', payload)
}

function openFirst() {
  const first = filteredStories.value[0] || stories[0]
  if (!first) return
  const progress = progressFor(first)
  const resume = Boolean(progress) && !progress.finished && Number(progress.sceneIndex) > 0
  emit('open', { story: first, resume })
}

function comingStyle(item) {
  return {
    '--coming-tint': item.tint,
    '--coming-tint-2': item.tint2,
  }
}
</script>

<style scoped>
.library {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(16px, 3vw, 34px) clamp(14px, 3vw, 28px) 40px;
}

.library-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand__mark {
  display: grid;
  place-items: center;
  width: clamp(46px, 5vw, 58px);
  height: clamp(46px, 5vw, 58px);
  border-radius: 18px;
  background: var(--cream);
  font-size: clamp(24px, 3vw, 30px);
  box-shadow: 0 10px 22px rgba(88, 74, 66, 0.14);
}

.brand__name {
  margin: 0;
  font-size: clamp(24px, 3.2vw, 34px);
  line-height: 1.15;
  color: var(--ink);
  letter-spacing: 0.02em;
}

.brand__tag {
  margin: 2px 0 0;
  font-size: clamp(11px, 1.2vw, 13px);
  color: var(--ink-2);
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
  align-items: center;
  gap: clamp(18px, 3vw, 40px);
  margin-top: clamp(20px, 3vw, 34px);
  padding: clamp(20px, 3vw, 34px);
  border-radius: 36px;
  background:
    radial-gradient(circle at 82% 18%, rgba(247, 198, 75, 0.3), transparent 46%),
    radial-gradient(circle at 12% 90%, rgba(166, 216, 233, 0.35), transparent 44%),
    var(--cream);
  box-shadow: 0 18px 44px rgba(88, 74, 66, 0.12);
  overflow: hidden;
}

.hero__copy {
  position: relative;
  z-index: 2;
}

.hero__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--coral);
  font-weight: 700;
}

.hero__title {
  margin: 8px 0 0;
  font-size: clamp(26px, 3.8vw, 42px);
  line-height: 1.2;
  color: var(--ink);
}

.hero__sub {
  margin: 12px 0 0;
  font-size: clamp(14px, 1.6vw, 17px);
  line-height: 1.7;
  color: var(--ink-2);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: clamp(16px, 2.4vw, 24px);
}

.hero__start {
  min-width: 160px;
  font-size: clamp(17px, 1.9vw, 20px);
}

.hero__hint {
  font-size: 12px;
  color: #b3a292;
}

.hero__art {
  position: relative;
  z-index: 1;
}

.hero__frame {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  aspect-ratio: 16 / 10;
  box-shadow: 0 20px 40px rgba(88, 74, 66, 0.2);
  transform: rotate(-1.5deg);
}

.hero__sticker {
  position: absolute;
  display: grid;
  place-items: center;
  width: clamp(40px, 5vw, 58px);
  height: clamp(40px, 5vw, 58px);
  border-radius: 50%;
  background: var(--cream);
  font-size: clamp(20px, 2.6vw, 30px);
  box-shadow: 0 10px 22px rgba(88, 74, 66, 0.18);
  animation: lx-float 5s ease-in-out infinite;
}

.hero__sticker--one {
  left: -12px;
  top: -14px;
}

.hero__sticker--two {
  right: -10px;
  bottom: -16px;
  animation-delay: 1.4s;
}

.age-filter {
  display: flex;
  gap: 8px;
  margin-top: clamp(20px, 3vw, 30px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.age-filter::-webkit-scrollbar {
  display: none;
}

.age-pill__short {
  display: none;
}

.age-pill {
  flex: none;
  padding: 9px 18px;
  border: 2px solid transparent;
  border-radius: 999px;
  background: var(--cream);
  color: var(--ink-2);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s var(--ease-soft);
  box-shadow: 0 4px 12px rgba(88, 74, 66, 0.08);
}

.age-pill:hover {
  color: var(--ink);
  transform: translateY(-1px);
}

.age-pill.is-active {
  border-color: var(--sun);
  background: #fff5d9;
  color: var(--ink);
  font-weight: 700;
}

.shelf {
  margin-top: clamp(22px, 3vw, 34px);
}

.shelf__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.shelf__title {
  margin: 0;
  font-size: clamp(20px, 2.4vw, 26px);
  color: var(--ink);
}

.shelf__count {
  margin: 0;
  font-size: 13px;
  color: var(--ink-2);
}

.shelf__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: clamp(16px, 2.4vw, 24px);
  margin-top: 16px;
}

.coming-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 30px;
  background: var(--cream);
  box-shadow: 0 14px 30px rgba(88, 74, 66, 0.1);
  opacity: 0.9;
}

.coming-card__art {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, var(--coming-tint), var(--coming-tint-2));
  overflow: hidden;
}

.coming-card__emoji {
  font-size: clamp(58px, 8vw, 86px);
  filter: drop-shadow(0 10px 16px rgba(88, 74, 66, 0.16));
}

/* 用两团圆角叠出云朵，而不是一根白色圆角条 */
.coming-card__cloud {
  position: absolute;
  width: 72px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 253, 247, 0.72);
  box-shadow:
    14px -12px 0 -2px rgba(255, 253, 247, 0.72),
    34px -4px 0 -6px rgba(255, 253, 247, 0.6);
}

.coming-card__cloud--a {
  top: 20%;
  left: 10%;
}

.coming-card__cloud--b {
  bottom: 20%;
  right: 9%;
  width: 96px;
  opacity: 0.85;
}

.coming-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: clamp(16px, 2vw, 24px);
}

.coming-card__badge {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--paper-2);
  color: #a87a4f;
  font-size: 12px;
  font-weight: 700;
}

.coming-card__body h3 {
  margin: 2px 0 0;
  font-size: clamp(19px, 2.1vw, 23px);
  color: var(--ink);
}

.coming-card__body p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-2);
}

.coming-card__age {
  margin-top: 4px !important;
  color: #b3a292 !important;
}

.shelf__empty {
  margin-top: 18px;
  padding: 24px;
  border-radius: 22px;
  background: var(--cream);
  color: var(--ink-2);
  text-align: center;
}

.how {
  margin-top: clamp(28px, 4vw, 44px);
  padding: clamp(20px, 3vw, 30px);
  border-radius: 30px;
  background: rgba(255, 253, 247, 0.7);
  border: 2px dashed #ecdcc8;
}

.how__title {
  margin: 0;
  font-size: clamp(18px, 2.2vw, 22px);
  color: var(--ink);
}

.how__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}

.how__step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 22px;
  background: var(--cream);
  box-shadow: 0 8px 18px rgba(88, 74, 66, 0.08);
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.55;
}

.how__step strong {
  font-size: 16px;
  color: var(--ink);
}

.how__num {
  position: absolute;
  top: 12px;
  right: 14px;
  font-size: 12px;
  font-weight: 700;
  color: #d8c3aa;
}

.how__emoji {
  font-size: 26px;
}

.library-foot {
  margin-top: clamp(26px, 4vw, 40px);
  padding-top: 18px;
  border-top: 1px solid #efe2d1;
  color: var(--ink-2);
  font-size: 13px;
  text-align: center;
}

.library-foot p {
  margin: 0;
}

.library-foot__small {
  margin-top: 6px !important;
  color: #b3a292;
  font-size: 12px;
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero__art {
    order: -1;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
  }

  .how__steps {
    grid-template-columns: 1fr;
  }
}

/* 手机横屏：高度只有 300~400px，首屏要把「开始故事」和故事卡一起露出来 */
@media (orientation: landscape) and (max-height: 560px) {
  .library {
    padding: 10px clamp(12px, 2vw, 20px) 28px;
  }

  .library-top {
    gap: 10px;
  }

  .brand__mark {
    width: 38px;
    height: 38px;
    border-radius: 14px;
    font-size: 20px;
  }

  .brand__name {
    font-size: 20px;
  }

  .brand__tag {
    display: none;
  }

  .hero {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 18px;
    margin-top: 12px;
    padding: 16px 20px;
    border-radius: 26px;
  }

  .hero__art {
    order: 0;
    max-width: none;
    width: auto;
  }

  .hero__frame {
    border-radius: 20px;
  }

  .hero__eyebrow {
    font-size: 11px;
  }

  .hero__title {
    margin-top: 4px;
    font-size: 24px;
  }

  .hero__sub {
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.55;
  }

  .hero__actions {
    margin-top: 12px;
    gap: 10px;
  }

  .hero__start {
    min-width: 140px;
    font-size: 16px;
  }

  .hero__hint {
    display: none;
  }

  .age-filter {
    margin-top: 12px;
    flex-wrap: wrap;
    overflow-x: visible;
  }

  .age-pill {
    padding: 7px 14px;
    font-size: 13px;
  }

  .shelf {
    margin-top: 14px;
  }
}

/* 更矮的横屏（≤430 高）：压间距并收起装饰插画，保证首屏能看到故事卡 */
@media (orientation: landscape) and (max-height: 430px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 14px 18px;
  }

  .hero__art {
    display: none;
  }

  .hero__title {
    font-size: 22px;
  }

  .hero__sub {
    margin-top: 4px;
    font-size: 13px;
    line-height: 1.5;
  }

  .hero__actions {
    margin-top: 10px;
  }

  .age-filter {
    margin-top: 10px;
  }

  .shelf {
    margin-top: 12px;
  }
}

@media (max-width: 640px) {
  .brand__tag {
    display: none;
  }

  .age-filter {
    flex-wrap: wrap;
    overflow-x: visible;
  }

  .age-pill {
    padding: 8px 14px;
    font-size: 13px;
  }

  /* 窄屏用短标签，四个 pill 才能两行排开 */
  .age-pill__full {
    display: none;
  }

  .age-pill__short {
    display: inline;
  }

  .library-top__settings-text {
    display: none;
  }

  .hero {
    padding: 18px;
    border-radius: 28px;
  }

  .shelf__grid {
    grid-template-columns: 1fr;
  }
}
</style>
