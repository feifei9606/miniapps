<template>
  <div class="settings-backdrop" @click.self="$emit('close')">
    <section
      ref="panel"
      class="settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      @keydown.esc.prevent="close"
    >
      <header class="settings__head">
        <div>
          <h2 id="settings-title" class="settings__title">家长设置</h2>
          <p class="settings__sub">陪孩子一起，把声音和节奏调到最舒服。</p>
        </div>
        <button ref="closeBtn" class="lx-icon-btn" type="button" aria-label="关闭设置" @click="close">
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div class="settings__body">
        <label class="setting">
          <span class="setting__label">
            音量
            <strong>{{ Math.round(store.settings.volume * 100) }}%</strong>
          </span>
          <input
            class="setting__range"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="store.settings.volume"
            @input="set('volume', Number($event.target.value))"
          />
        </label>

        <label class="setting">
          <span class="setting__label">
            朗读速度
            <strong>{{ Number(store.settings.rate).toFixed(2) }}×</strong>
          </span>
          <input
            class="setting__range"
            type="range"
            min="0.7"
            max="1.2"
            step="0.02"
            :value="store.settings.rate"
            @input="set('rate', Number($event.target.value))"
          />
          <span class="setting__hint">慢一点，孩子更容易跟上。</span>
        </label>

        <div class="setting setting--switch">
          <span class="setting__label">背景音乐</span>
          <button
            class="switch"
            :class="{ 'is-on': store.settings.music }"
            type="button"
            role="switch"
            :aria-checked="store.settings.music"
            @click="set('music', !store.settings.music)"
          >
            <span class="switch__thumb" />
          </button>
        </div>

        <div class="setting setting--switch">
          <span class="setting__label">故事旁白</span>
          <button
            class="switch"
            :class="{ 'is-on': store.settings.narration }"
            type="button"
            role="switch"
            :aria-checked="store.settings.narration"
            @click="set('narration', !store.settings.narration)"
          >
            <span class="switch__thumb" />
          </button>
        </div>

        <div class="setting setting--switch">
          <span class="setting__label">
            减少动画
            <span class="setting__hint setting__hint--inline">画面更安静，适合睡前</span>
          </span>
          <button
            class="switch"
            :class="{ 'is-on': store.settings.reduceMotion }"
            type="button"
            role="switch"
            :aria-checked="store.settings.reduceMotion"
            @click="set('reduceMotion', !store.settings.reduceMotion)"
          >
            <span class="switch__thumb" />
          </button>
        </div>

        <label class="setting">
          <span class="setting__label">默认年龄筛选</span>
          <select
            class="setting__select"
            :value="store.settings.ageFilter"
            @change="set('ageFilter', $event.target.value)"
          >
            <option v-for="age in AGE_FILTERS" :key="age.id" :value="age.id">
              {{ age.emoji }} {{ age.label }}
            </option>
          </select>
        </label>

        <div class="settings__divider" />

        <div class="settings__actions">
          <button class="lx-btn lx-btn--ghost" type="button" @click="resetAll">恢复默认设置</button>
          <button class="lx-btn lx-btn--danger" type="button" @click="clearProgress">清除全部进度</button>
        </div>

        <p class="settings__tip">
          小提示：手机或平板第一次播放声音前，需要先点一下屏幕。所有设置和进度只保存在本设备，不会上传。
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { AGE_FILTERS } from '../data/categories'
import { clearAllProgress, resetSettings, store, updateSetting } from '../engine/progress'

const emit = defineEmits(['close'])

const panel = ref(null)
const closeBtn = ref(null)

function set(key, value) {
  updateSetting(key, value)
}

function close() {
  emit('close')
}

function resetAll() {
  resetSettings()
}

function clearProgress() {
  if (window.confirm('清除所有故事的阅读进度？设置会保留。')) {
    clearAllProgress()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  closeBtn.value?.focus()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(58, 46, 38, 0.42);
  backdrop-filter: blur(4px);
  animation: fade-in 0.2s ease both;
}

.settings {
  width: min(520px, 100%);
  max-height: min(88dvh, 760px);
  overflow-y: auto;
  border-radius: 30px;
  background: var(--cream);
  box-shadow: 0 30px 70px rgba(40, 30, 22, 0.34);
  animation: rise-in 0.28s var(--ease-bounce) both;
}

.settings__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 12px;
}

.settings__title {
  margin: 0;
  font-size: 24px;
  color: var(--ink);
}

.settings__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ink-2);
}

.settings__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 24px 24px;
}

.setting {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.setting__label strong {
  font-size: 13px;
  color: var(--ink-2);
  font-weight: 600;
}

.setting__hint {
  font-size: 12px;
  color: #b3a292;
}

.setting__hint--inline {
  font-weight: 400;
}

.setting__range {
  width: 100%;
  height: 26px;
  accent-color: var(--coral);
  cursor: pointer;
}

.setting--switch {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.switch {
  position: relative;
  flex: none;
  width: 58px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: #e7dac9;
  cursor: pointer;
  transition: background 0.2s ease;
}

.switch.is-on {
  background: var(--grass);
}

.switch__thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(88, 74, 66, 0.25);
  transition: transform 0.2s var(--ease-bounce);
}

.switch.is-on .switch__thumb {
  transform: translateX(24px);
}

.setting__select {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #efe2d1;
  border-radius: 16px;
  background: #fff;
  color: var(--ink);
  font-family: inherit;
  font-size: 15px;
}

.settings__divider {
  height: 1px;
  background: #efe2d1;
  margin: 2px 0;
}

.settings__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.settings__actions .lx-btn {
  flex: 1 1 calc(50% - 5px);
  min-width: 0;
  padding: 14px 12px;
  font-size: clamp(13px, 3.8vw, 17px);
}

@media (max-width: 350px) {
  .settings__actions {
    flex-direction: column;
  }

  .settings__actions .lx-btn {
    flex: 1 1 100%;
  }
}

.lx-btn--danger {
  background: #fde8e4;
  color: #b4554a;
  box-shadow: 0 5px 0 #f2c9c2;
}

.settings__tip {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--paper-2);
  color: var(--ink-2);
  font-size: 12px;
  line-height: 1.6;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
}
</style>
