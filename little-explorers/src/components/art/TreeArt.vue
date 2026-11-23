<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <ellipse cx="0" cy="4" rx="78" ry="14" fill="#5f9e70" opacity="0.16" />
    <path d="M-16 0 q-4 -70 6 -118 h22 q10 50 6 118 z" fill="#C99B77" />
    <path d="M-16 0 q-4 -70 6 -118 h8 q-6 50 -2 118 z" fill="#B98A66" opacity="0.6" />
    <g class="tree-sway" :style="{ animationDelay: `${delay}s` }">
      <circle cx="-46" cy="-130" r="46" fill="#8CC98A" />
      <circle cx="40" cy="-136" r="50" fill="#7FBC84" />
      <circle cx="0" cy="-166" r="52" fill="#A8D39A" />
      <circle cx="-18" cy="-124" r="38" fill="#A8D39A" />
      <circle cx="30" cy="-104" r="34" fill="#8CC98A" />
      <circle cx="-52" cy="-150" r="7" fill="#F7C64B" opacity="0.9" />
      <circle cx="52" cy="-120" r="6" fill="#F7C64B" opacity="0.9" />
      <circle cx="8" cy="-190" r="6" fill="#F7C64B" opacity="0.9" />
    </g>
  </g>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  delay: { type: Number, default: 0 },
})
</script>

<style scoped>
.tree-sway {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: tree-sway 6s ease-in-out infinite;
}

@keyframes tree-sway {
  0%,
  100% {
    transform: rotate(-1deg);
  }
  50% {
    transform: rotate(1.4deg);
  }
}
</style>
