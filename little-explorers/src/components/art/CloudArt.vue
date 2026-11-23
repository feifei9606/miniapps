<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`" :opacity="opacity">
    <g class="cloud-float" :style="{ animationDelay: `${delay}s` }">
      <ellipse cx="0" cy="0" rx="58" ry="30" fill="#FFFDF7" />
      <ellipse cx="-34" cy="8" rx="34" ry="22" fill="#FFFDF7" />
      <ellipse cx="36" cy="6" rx="30" ry="20" fill="#FFFDF7" />
      <ellipse cx="4" cy="-18" rx="30" ry="24" fill="#FFFDF7" />
    </g>
  </g>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  opacity: { type: Number, default: 0.92 },
  delay: { type: Number, default: 0 },
})
</script>

<style scoped>
.cloud-float {
  animation: cloud-drift 9s ease-in-out infinite;
}

@keyframes cloud-drift {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(14px);
  }
}
</style>
