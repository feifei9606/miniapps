<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <g class="rainbow-float">
      <g
        v-for="band in bands"
        :key="band.id"
        class="band"
        role="button"
        tabindex="0"
        :aria-label="band.label"
        @click.stop="$emit('color', band.id)"
        @keydown.enter.prevent="$emit('color', band.id)"
      >
        <path
          :d="arc(band.radius)"
          fill="none"
          :stroke="band.color"
          :stroke-width="44"
          stroke-linecap="round"
          :opacity="lit[band.id] ? 1 : 0.62"
          :class="{ 'is-lit': lit[band.id] }"
        />
        <path :d="arc(band.radius)" fill="none" stroke="transparent" stroke-width="78" />
        <g v-if="lit[band.id]" class="band-sparkle">
          <circle :cx="band.sparkleX" :cy="band.sparkleY" r="5" fill="#FFFDF7" />
          <circle :cx="band.sparkleX + 18" :cy="band.sparkleY + 12" r="3" fill="#FFFDF7" />
        </g>
      </g>
    </g>
  </g>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  lit: {
    type: Object,
    default: () => ({ red: false, yellow: false, blue: false }),
  },
})

defineEmits(['color'])

const bands = [
  { id: 'red', label: '红色', color: '#E3695F', radius: 300, sparkleX: -196, sparkleY: -178 },
  { id: 'yellow', label: '黄色', color: '#F7C64B', radius: 250, sparkleX: -160, sparkleY: -150 },
  { id: 'blue', label: '蓝色', color: '#8FC7E8', radius: 200, sparkleX: -124, sparkleY: -120 },
]

function arc(radius) {
  return `M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`
}
</script>

<style scoped>
.rainbow-float {
  animation: rainbow-breathe 7s ease-in-out infinite;
}

.band {
  cursor: pointer;
  outline: none;
}

/* 键盘聚焦时用发光代替默认黑框（默认框会套住整个彩虹，非常突兀） */
.band:focus-visible {
  filter: drop-shadow(0 0 14px rgba(239, 139, 123, 0.9));
}

.band path:first-child {
  transition: opacity 0.3s ease;
}

.band.is-lit {
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.75));
}

.band-sparkle {
  animation: sparkle-twinkle 1.6s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes rainbow-breathe {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes sparkle-twinkle {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}
</style>
