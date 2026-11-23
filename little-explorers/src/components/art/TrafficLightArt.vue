<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <rect x="-7" y="250" width="14" height="130" rx="7" fill="#8C7768" />
    <rect x="-58" y="-18" width="116" height="286" rx="26" fill="#6F6259" stroke="#584A42" stroke-width="5" />
    <rect x="-46" y="-6" width="92" height="262" rx="20" fill="#4A4038" opacity="0.55" />

    <g
      v-for="lamp in lamps"
      :key="lamp.id"
      class="lamp"
      role="button"
      tabindex="0"
      :aria-label="lamp.label"
      @click.stop="$emit('lamp', lamp.id)"
      @keydown.enter.prevent="$emit('lamp', lamp.id)"
    >
      <circle :cx="0" :cy="lamp.y" r="38" :fill="lamp.off" opacity="0.55" />
      <circle
        :cx="0"
        :cy="lamp.y"
        r="30"
        :fill="lamp.color"
        :opacity="light === lamp.id ? 1 : 0.28"
        :class="{ 'is-on': light === lamp.id }"
      />
      <circle
        v-if="light === lamp.id"
        :cx="0"
        :cy="lamp.y"
        r="52"
        :fill="lamp.color"
        opacity="0.3"
        class="lamp-glow"
      />
      <circle :cx="-10" :cy="lamp.y - 10" r="7" fill="#FFFDF7" :opacity="light === lamp.id ? 0.6 : 0.18" />
    </g>
  </g>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  light: { type: String, default: '' },
})

defineEmits(['lamp'])

const lamps = [
  { id: 'red', label: '红灯', y: 44, color: '#E3695F', off: '#7E4A45' },
  { id: 'yellow', label: '黄灯', y: 130, color: '#F7C64B', off: '#7E6A3E' },
  { id: 'green', label: '绿灯', y: 216, color: '#7FBC84', off: '#456B4B' },
]
</script>

<style scoped>
.lamp {
  cursor: pointer;
  outline: none;
}

.lamp:focus-visible {
  filter: drop-shadow(0 0 12px rgba(247, 198, 75, 0.95));
}

.lamp-glow {
  animation: glow-breathe 2s ease-in-out infinite;
}

@keyframes glow-breathe {
  0%,
  100% {
    opacity: 0.18;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
