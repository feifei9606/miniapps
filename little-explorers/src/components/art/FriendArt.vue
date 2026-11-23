<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <ellipse cx="0" cy="52" rx="26" ry="6" fill="#5f9e70" opacity="0.14" />

    <!-- 小兔子 -->
    <g v-if="kind === 'rabbit'" class="friend" :class="{ 'is-happy': happy }">
      <ellipse cx="-10" cy="-52" rx="7" ry="24" fill="#FFF3E6" transform="rotate(-10 -10 -52)" />
      <ellipse cx="10" cy="-52" rx="7" ry="24" fill="#FFF3E6" transform="rotate(10 10 -52)" />
      <ellipse cx="-10" cy="-52" rx="3.5" ry="17" fill="#F6BCC4" transform="rotate(-10 -10 -52)" />
      <ellipse cx="10" cy="-52" rx="3.5" ry="17" fill="#F6BCC4" transform="rotate(10 10 -52)" />
      <ellipse cx="0" cy="20" rx="25" ry="25" fill="#FFF3E6" />
      <ellipse cx="-13" cy="45" rx="11" ry="6" fill="#FFF3E6" />
      <ellipse cx="13" cy="45" rx="11" ry="6" fill="#FFF3E6" />
      <ellipse cx="-24" cy="16" rx="8" ry="12" fill="#FFF3E6" transform="rotate(18 -24 16)" />
      <ellipse cx="24" cy="16" rx="8" ry="12" fill="#FFF3E6" transform="rotate(-18 24 16)" />
      <circle cx="0" cy="-22" r="23" fill="#FFF3E6" />
      <g v-if="happy">
        <path d="M-13 -26 q6 -7 12 0" fill="none" stroke="#584A42" stroke-width="3" stroke-linecap="round" />
        <path d="M1 -26 q6 -7 12 0" fill="none" stroke="#584A42" stroke-width="3" stroke-linecap="round" />
      </g>
      <g v-else>
        <circle cx="-7" cy="-25" r="3" fill="#584A42" />
        <circle cx="7" cy="-25" r="3" fill="#584A42" />
      </g>
      <circle cx="0" cy="-16" r="3" fill="#EF8B7B" />
      <path d="M-5 -12 q5 6 10 0" fill="none" stroke="#584A42" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="-15" cy="-15" r="4" fill="#F19A8C" opacity="0.55" />
      <circle cx="15" cy="-15" r="4" fill="#F19A8C" opacity="0.55" />
    </g>

    <!-- 小熊 -->
    <g v-else-if="kind === 'bear'" class="friend" :class="{ 'is-happy': happy }">
      <circle cx="-17" cy="-38" r="10" fill="#C99B77" />
      <circle cx="17" cy="-38" r="10" fill="#C99B77" />
      <circle cx="-17" cy="-38" r="5" fill="#E7C3A4" />
      <circle cx="17" cy="-38" r="5" fill="#E7C3A4" />
      <ellipse cx="0" cy="20" rx="27" ry="26" fill="#C99B77" />
      <ellipse cx="0" cy="24" rx="16" ry="17" fill="#E7C3A4" />
      <ellipse cx="-14" cy="44" rx="12" ry="6" fill="#B98A66" />
      <ellipse cx="14" cy="44" rx="12" ry="6" fill="#B98A66" />
      <ellipse cx="-25" cy="14" rx="8" ry="13" fill="#C99B77" transform="rotate(20 -25 14)" />
      <ellipse cx="25" cy="14" rx="8" ry="13" fill="#C99B77" transform="rotate(-20 25 14)" />
      <circle cx="0" cy="-22" r="24" fill="#C99B77" />
      <ellipse cx="0" cy="-13" rx="12" ry="9" fill="#E7C3A4" />
      <g v-if="happy">
        <path d="M-13 -28 q6 -7 12 0" fill="none" stroke="#584A42" stroke-width="3" stroke-linecap="round" />
        <path d="M1 -28 q6 -7 12 0" fill="none" stroke="#584A42" stroke-width="3" stroke-linecap="round" />
      </g>
      <g v-else>
        <circle cx="-7" cy="-26" r="3" fill="#584A42" />
        <circle cx="7" cy="-26" r="3" fill="#584A42" />
      </g>
      <ellipse cx="0" cy="-15" rx="4" ry="3" fill="#584A42" />
      <path d="M-5 -10 q5 6 10 0" fill="none" stroke="#584A42" stroke-width="2.4" stroke-linecap="round" />
      <circle cx="-16" cy="-16" r="4" fill="#F19A8C" opacity="0.45" />
      <circle cx="16" cy="-16" r="4" fill="#F19A8C" opacity="0.45" />
    </g>

    <!-- 小鸭子 -->
    <g v-else-if="kind === 'duck'" class="friend" :class="{ 'is-happy': happy }">
      <ellipse cx="0" cy="22" rx="27" ry="21" fill="#F9DE7A" />
      <ellipse cx="-16" cy="38" rx="9" ry="5" fill="#F0A24E" />
      <ellipse cx="16" cy="38" rx="9" ry="5" fill="#F0A24E" />
      <ellipse cx="-20" cy="18" rx="10" ry="13" fill="#F7D264" transform="rotate(22 -20 18)" />
      <ellipse cx="20" cy="18" rx="10" ry="13" fill="#F7D264" transform="rotate(-22 20 18)" />
      <circle cx="0" cy="-18" r="19" fill="#F9DE7A" />
      <circle cx="0" cy="-33" r="5" fill="#F7D264" />
      <g v-if="happy">
        <path d="M-11 -21 q5 -6 10 0" fill="none" stroke="#584A42" stroke-width="2.8" stroke-linecap="round" />
      </g>
      <g v-else>
        <circle cx="-6" cy="-21" r="2.8" fill="#584A42" />
      </g>
      <circle cx="7" cy="-21" r="2.8" fill="#584A42" />
      <ellipse cx="0" cy="-11" rx="10" ry="5.5" fill="#F0A24E" />
      <circle cx="-13" cy="-12" r="3.5" fill="#F19A8C" opacity="0.5" />
    </g>

    <!-- 小鸟 -->
    <g v-else-if="kind === 'bird'" class="friend" :class="{ 'is-happy': happy }">
      <ellipse cx="0" cy="0" rx="14" ry="10" fill="#8FC7E8" />
      <circle cx="9" cy="-7" r="8" fill="#8FC7E8" />
      <path d="M-2 -4 q-10 -10 -14 2 q8 4 14 -2" fill="#6FAED4" />
      <path d="M16 -7 l8 3 l-8 3 z" fill="#F0A24E" />
      <circle cx="12" cy="-9" r="1.8" fill="#584A42" />
      <path d="M-12 2 l-9 -3 l6 7 z" fill="#6FAED4" />
    </g>
  </g>
</template>

<script setup>
defineProps({
  kind: { type: String, default: 'rabbit' },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  happy: { type: Boolean, default: false },
})
</script>

<style scoped>
.friend {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: friend-bob 3.2s ease-in-out infinite;
}

.friend.is-happy {
  animation: friend-hop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes friend-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes friend-hop {
  0% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-14px) scale(1.03, 0.97);
  }
  70% {
    transform: translateY(0) scale(0.98, 1.02);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}
</style>
