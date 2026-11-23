<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <circle r="72" :fill="moon ? '#FFF6D8' : '#FFE8A3'" opacity="0.32" />
    <g v-if="!moon" class="sun-rays">
      <line
        v-for="ray in rays"
        :key="ray"
        x1="0"
        y1="-54"
        x2="0"
        y2="-70"
        stroke="#F7C64B"
        stroke-width="8"
        stroke-linecap="round"
        :transform="`rotate(${ray})`"
      />
    </g>
    <circle r="44" :fill="moon ? '#FFF6D8' : '#F7C64B'" />
    <g v-if="moon">
      <circle cx="-14" cy="-10" r="7" fill="#F2E2B8" opacity="0.8" />
      <circle cx="12" cy="12" r="5" fill="#F2E2B8" opacity="0.8" />
      <circle cx="16" cy="-18" r="3.5" fill="#F2E2B8" opacity="0.8" />
      <path d="M-20 -4 q6 5 12 0" fill="none" stroke="#584A42" stroke-width="3" stroke-linecap="round" opacity="0.6" />
      <path d="M2 -4 q6 5 12 0" fill="none" stroke="#584A42" stroke-width="3" stroke-linecap="round" opacity="0.6" />
    </g>
    <g v-else>
      <g v-if="happy">
        <path d="M-20 -8 q7 -8 14 0" fill="none" stroke="#7A5B33" stroke-width="4" stroke-linecap="round" />
        <path d="M6 -8 q7 -8 14 0" fill="none" stroke="#7A5B33" stroke-width="4" stroke-linecap="round" />
        <path d="M-8 8 q8 10 16 0" fill="none" stroke="#7A5B33" stroke-width="4" stroke-linecap="round" />
      </g>
      <g v-else>
        <circle cx="-13" cy="-6" r="4" fill="#7A5B33" />
        <circle cx="13" cy="-6" r="4" fill="#7A5B33" />
        <path d="M-7 8 q7 8 14 0" fill="none" stroke="#7A5B33" stroke-width="4" stroke-linecap="round" />
      </g>
      <circle cx="-26" cy="8" r="7" fill="#F19A8C" opacity="0.55" />
      <circle cx="26" cy="8" r="7" fill="#F19A8C" opacity="0.55" />
    </g>
  </g>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  happy: { type: Boolean, default: false },
  moon: { type: Boolean, default: false },
})

const rays = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
</script>

<style scoped>
.sun-rays {
  transform-box: fill-box;
  transform-origin: center;
  animation: rays-turn 60s linear infinite;
}

@keyframes rays-turn {
  to {
    transform: rotate(360deg);
  }
}
</style>
