<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <g class="flower-sway" :style="{ animationDelay: `${delay}s` }">
      <path d="M0 0 q-4 -18 0 -34" fill="none" stroke="#6FA96F" stroke-width="4" stroke-linecap="round" />
      <ellipse cx="-7" cy="-12" rx="7" ry="4" fill="#8CC98A" transform="rotate(-24 -7 -12)" />
      <ellipse cx="7" cy="-18" rx="7" ry="4" fill="#8CC98A" transform="rotate(24 7 -18)" />
      <g class="petals" :class="{ 'is-bloom': bloom }">
        <circle v-for="angle in angles" :key="angle" cx="0" cy="-8" r="8" :fill="color" :transform="`rotate(${angle} 0 -34)`" />
        <circle cx="0" cy="-34" r="7" fill="#F7C64B" />
        <circle cx="0" cy="-34" r="3" fill="#E0A93B" />
      </g>
    </g>
  </g>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  color: { type: String, default: '#F6BCC4' },
  bloom: { type: Boolean, default: false },
  delay: { type: Number, default: 0 },
})

const angles = [0, 72, 144, 216, 288]
</script>

<style scoped>
.flower-sway {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: flower-sway 4.5s ease-in-out infinite;
}

.petals {
  transform-box: fill-box;
  transform-origin: center bottom;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.petals.is-bloom {
  transform: scale(1.25);
}

@keyframes flower-sway {
  0%,
  100% {
    transform: rotate(-2deg);
  }
  50% {
    transform: rotate(3deg);
  }
}
</style>
