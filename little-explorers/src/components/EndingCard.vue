<template>
  <div class="ending">
    <div class="ending-sky" aria-hidden="true">
      <span class="moon">🌙</span>
      <span v-for="n in 7" :key="n" class="star" :style="starStyle(n)" />
    </div>

    <div class="ending-card">
      <p class="ending-kicker">今天的故事</p>
      <h2 class="ending-title">{{ story.ending?.title || '故事结束啦！' }}</h2>
      <p class="ending-message">{{ story.ending?.message }}</p>
      <p v-if="story.ending?.cheer" class="ending-cheer">{{ story.ending.cheer }}</p>

      <ul v-if="story.ending?.friends?.length" class="ending-friends" aria-label="今天帮助过的朋友">
        <li v-for="friend in story.ending.friends" :key="friend.name" class="ending-friend">
          <span class="ending-friend__emoji" aria-hidden="true">{{ friend.emoji }}</span>
          <span>{{ friend.name }}</span>
        </li>
      </ul>

      <div class="ending-actions">
        <button class="lx-btn lx-btn--primary" type="button" @click="$emit('replay')">
          <span aria-hidden="true">🔁</span> 再听一次
        </button>
        <button class="lx-btn lx-btn--ghost" type="button" @click="$emit('exit')">
          <span aria-hidden="true">🏠</span> 回书架
        </button>
      </div>

      <p class="ending-next">{{ story.ending?.hint || '下一个故事正在路上…' }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  story: { type: Object, required: true },
})

defineEmits(['replay', 'exit'])

function starStyle(n) {
  const seed = (n * 37) % 100
  return {
    left: `${8 + seed * 0.84}%`,
    top: `${8 + ((n * 53) % 62)}%`,
    animationDelay: `${(n % 5) * 0.6}s`,
    transform: `scale(${0.6 + (n % 3) * 0.35})`,
  }
}
</script>

<style scoped>
.ending {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: clamp(12px, 3vw, 32px);
  background:
    radial-gradient(circle at 50% 120%, rgba(247, 198, 75, 0.28), transparent 55%),
    linear-gradient(180deg, #6e6696 0%, #9a86ad 48%, #f3b49b 100%);
  overflow: hidden;
}

.ending-sky {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.moon {
  position: absolute;
  top: 8%;
  right: 12%;
  font-size: clamp(40px, 6vw, 74px);
  filter: drop-shadow(0 0 24px rgba(255, 236, 180, 0.55));
  animation: lx-float 6s ease-in-out infinite;
}

.star {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff4cf;
  box-shadow: 0 0 10px rgba(255, 244, 207, 0.8);
  animation: lx-twinkle 2.4s ease-in-out infinite;
}

.ending-card {
  position: relative;
  width: min(680px, 100%);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: clamp(20px, 3.4vw, 38px) clamp(20px, 4vw, 44px);
  border-radius: clamp(22px, 3vw, 34px);
  background: rgba(255, 253, 247, 0.96);
  text-align: center;
  box-shadow: 0 26px 60px rgba(40, 32, 56, 0.32);
}

.ending-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.22em;
  color: var(--ink-2);
}

.ending-title {
  margin: 0;
  font-size: clamp(26px, 3.6vw, 40px);
  line-height: 1.2;
  color: var(--ink);
}

.ending-message {
  margin: 10px 0 0;
  font-size: clamp(15px, 1.8vw, 19px);
  line-height: 1.6;
  color: var(--ink-2);
}

.ending-cheer {
  display: inline-block;
  margin: 14px 0 0;
  padding: 8px 22px;
  border-radius: 999px;
  background: #fff0c8;
  color: #8a5c1c;
  font-size: clamp(16px, 1.9vw, 20px);
  font-weight: 700;
}

.ending-friends {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.ending-friend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 999px;
  background: var(--paper-2);
  color: var(--ink);
  font-size: clamp(14px, 1.6vw, 17px);
}

.ending-friend__emoji {
  font-size: 1.3em;
}

.ending-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: clamp(16px, 2.6vw, 26px);
}

.ending-actions .lx-btn {
  min-width: 140px;
}

.ending-next {
  margin: 14px 0 0;
  font-size: 13px;
  color: #b3a292;
}
</style>
