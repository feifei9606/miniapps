<template>
  <div class="sheet">
    <header class="sheet__head">
      <div>
        <p class="sheet__eyebrow">开发预览</p>
        <h1 class="sheet__title">{{ story.title }}</h1>
        <p class="sheet__sub">所有场景、交互热区与角色状态一览，仅用于检查画面。</p>
      </div>
      <button class="lx-btn lx-btn--ghost" type="button" @click="$emit('exit')">回首页</button>
    </header>

    <section class="sheet__section">
      <h2 class="sheet__h2">角色表</h2>
      <div class="sheet__chars">
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="嘟嘟侧面">
              <BusArt :x="200" :y="170" :scale="0.9" eyes="open" :light-on="true" />
            </svg>
          </div>
          <figcaption>嘟嘟 · 侧面</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="嘟嘟开心">
              <BusArt :x="200" :y="170" :scale="0.9" eyes="happy" :light-on="true" :friends="{ rabbit: true, bear: true, duck: true }" />
            </svg>
          </div>
          <figcaption>嘟嘟 · 开心 / 载着朋友</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="嘟嘟睡觉">
              <BusArt :x="200" :y="170" :scale="0.9" eyes="sleep" />
            </svg>
          </div>
          <figcaption>嘟嘟 · 睡觉</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="小兔子">
              <FriendArt kind="rabbit" :x="200" :y="180" :scale="1.5" happy />
            </svg>
          </div>
          <figcaption>小兔子</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="小熊">
              <FriendArt kind="bear" :x="200" :y="180" :scale="1.5" happy />
            </svg>
          </div>
          <figcaption>小熊</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="小鸭子">
              <FriendArt kind="duck" :x="200" :y="180" :scale="1.5" happy />
            </svg>
          </div>
          <figcaption>小鸭子</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="太阳">
              <SunArt :x="200" :y="150" :scale="1.4" happy />
            </svg>
          </div>
          <figcaption>太阳公公</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="红绿灯">
              <TrafficLightArt :x="200" :y="60" :scale="0.6" light="green" />
            </svg>
          </div>
          <figcaption>红绿灯</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="雨伞">
              <UmbrellaArt :x="200" :y="100" :scale="1.2" open />
            </svg>
          </div>
          <figcaption>小雨伞</figcaption>
        </figure>
        <figure class="char">
          <div class="char__frame">
            <svg viewBox="0 0 400 300" role="img" aria-label="彩虹">
              <RainbowArt :x="200" :y="210" :scale="0.5" :lit="{ red: true, yellow: true, blue: true }" />
            </svg>
          </div>
          <figcaption>彩虹</figcaption>
        </figure>
      </div>
    </section>

    <section v-for="(scene, index) in story.scenes" :key="scene.id" class="sheet__section">
      <h2 class="sheet__h2">
        {{ index + 1 }}. {{ scene.title }}
        <code class="sheet__code">{{ scene.art }}</code>
      </h2>
      <div class="sheet__frame">
        <SceneArt :art="scene.art" :flags="previewFlags" light="green" :view-box="'0 0 1000 620'" />
      </div>
      <ul class="sheet__chips">
        <li v-for="item in scene.interactions" :key="item.id">
          <strong>{{ item.id }}</strong> {{ item.label }}
          <span class="sheet__at">{{ item.at?.x }}%, {{ item.at?.y }}%</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SceneArt from './art/SceneArt.vue'
import BusArt from './art/BusArt.vue'
import FriendArt from './art/FriendArt.vue'
import SunArt from './art/SunArt.vue'
import TrafficLightArt from './art/TrafficLightArt.vue'
import UmbrellaArt from './art/UmbrellaArt.vue'
import RainbowArt from './art/RainbowArt.vue'

const props = defineProps({
  story: { type: Object, required: true },
})

defineEmits(['exit'])

const previewFlags = computed(() => {
  const flags = {}
  for (const scene of props.story.scenes) {
    for (const item of scene.interactions || []) {
      if (item.flag) flags[item.flag] = true
    }
  }
  return flags
})
</script>

<style scoped>
.sheet {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 24px 18px 60px;
}

.sheet__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.sheet__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--coral);
}

.sheet__title {
  margin: 4px 0 0;
  font-size: 28px;
  color: var(--ink);
}

.sheet__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ink-2);
}

.sheet__section {
  margin-top: 28px;
}

.sheet__h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  font-size: 18px;
  color: var(--ink);
}

.sheet__code {
  padding: 3px 8px;
  border-radius: 8px;
  background: #efe2d1;
  color: #8a6a4f;
  font-size: 12px;
}

.sheet__chars {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.char {
  margin: 0;
  overflow: hidden;
  border-radius: 18px;
  background: var(--cream);
  box-shadow: 0 8px 18px rgba(88, 74, 66, 0.1);
}

.char__frame {
  aspect-ratio: 4 / 3;
  background: linear-gradient(180deg, #dff0f6, #f6f0df);
}

.char__frame svg {
  display: block;
  width: 100%;
  height: 100%;
}

.char figcaption {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--ink-2);
}

.sheet__frame {
  overflow: hidden;
  border-radius: 20px;
  background: var(--paper-2);
  box-shadow: 0 12px 26px rgba(88, 74, 66, 0.12);
}

.sheet__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.sheet__chips li {
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--cream);
  font-size: 12px;
  color: var(--ink-2);
}

.sheet__chips strong {
  color: var(--ink);
}

.sheet__at {
  margin-left: 4px;
  color: #b3a292;
  font-variant-numeric: tabular-nums;
}
</style>
