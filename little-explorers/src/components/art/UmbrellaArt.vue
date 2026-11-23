<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <g class="umbrella" :class="{ 'is-open': open }">
      <path
        v-if="open"
        d="M-112 6 Q-112 -66 0 -70 Q112 -66 112 6 Q84 22 56 6 Q28 22 0 6 Q-28 22 -56 6 Q-84 22 -112 6 Z"
        fill="#EF8B7B"
        stroke="#D9675D"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        v-if="open"
        d="M-112 6 Q-84 -30 -56 6 M-56 6 Q-28 -30 0 6 M0 6 Q28 -30 56 6 M56 6 Q84 -30 112 6"
        fill="none"
        stroke="#D9675D"
        stroke-width="3"
        opacity="0.55"
      />
      <g v-else>
        <path d="M-16 8 Q-14 -58 0 -74 Q14 -58 16 8 Z" fill="#EF8B7B" stroke="#D9675D" stroke-width="4" stroke-linejoin="round" />
        <path d="M0 -70 q-8 34 0 76" fill="none" stroke="#D9675D" stroke-width="3" opacity="0.5" />
      </g>
      <rect x="-3.5" y="-2" width="7" height="132" rx="3.5" fill="#A9835F" />
      <path d="M0 128 q0 22 -22 22" fill="none" stroke="#A9835F" stroke-width="7" stroke-linecap="round" />
      <circle cx="0" cy="-74" r="6" fill="#F7C64B" />
    </g>
  </g>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  open: { type: Boolean, default: false },
})
</script>

<style scoped>
.umbrella {
  transform-box: fill-box;
  transform-origin: center bottom;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.umbrella.is-open {
  transform: scale(1.05);
}
</style>
