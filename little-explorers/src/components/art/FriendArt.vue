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

    <!-- 小海龟 -->
    <g v-else-if="kind === 'turtle'" class="friend" :class="{ 'is-happy': happy }">
      <ellipse cx="-30" cy="34" rx="9" ry="6" fill="#9ED8B6" />
      <ellipse cx="30" cy="34" rx="9" ry="6" fill="#9ED8B6" />
      <ellipse cx="-26" cy="46" rx="10" ry="5" fill="#8ACBAA" />
      <ellipse cx="26" cy="46" rx="10" ry="5" fill="#8ACBAA" />
      <path d="M-34 12 q6 -30 34 -30 q28 0 34 30 z" fill="#7FC29B" />
      <path d="M-20 4 q4 -14 20 -14 q16 0 20 14" fill="none" stroke="#5FA97F" stroke-width="3" stroke-linecap="round" />
      <ellipse cx="0" cy="16" rx="38" ry="18" fill="#F6E0A8" stroke="#C9A96A" stroke-width="3" />
      <circle cx="-12" cy="16" r="2.6" fill="#C9A96A" />
      <circle cx="0" cy="12" r="2.6" fill="#C9A96A" />
      <circle cx="12" cy="18" r="2.6" fill="#C9A96A" />
      <circle cx="0" cy="-20" r="17" fill="#9ED8B6" />
      <g v-if="happy">
        <path d="M-9 -23 q5 -6 10 0" fill="none" stroke="#584A42" stroke-width="2.6" stroke-linecap="round" />
        <path d="M1 -23 q5 -6 10 0" fill="none" stroke="#584A42" stroke-width="2.6" stroke-linecap="round" />
      </g>
      <g v-else>
        <circle cx="-6" cy="-22" r="2.6" fill="#584A42" />
        <circle cx="6" cy="-22" r="2.6" fill="#584A42" />
      </g>
      <path d="M-5 -14 q5 5 10 0" fill="none" stroke="#584A42" stroke-width="2.2" stroke-linecap="round" />
    </g>

    <!-- 小螃蟹 -->
    <g v-else-if="kind === 'crab'" class="friend crab" :class="{ 'is-happy': happy }">
      <g class="crab-legs">
        <path d="M-18 12 l-14 10" stroke="#E8735F" stroke-width="5" stroke-linecap="round" />
        <path d="M-16 22 l-14 8" stroke="#E8735F" stroke-width="5" stroke-linecap="round" />
        <path d="M18 12 l14 10" stroke="#E8735F" stroke-width="5" stroke-linecap="round" />
        <path d="M16 22 l14 8" stroke="#E8735F" stroke-width="5" stroke-linecap="round" />
      </g>
      <ellipse cx="0" cy="14" rx="26" ry="19" fill="#F08A72" />
      <ellipse cx="-16" cy="30" rx="8" ry="5" fill="#E8735F" />
      <ellipse cx="16" cy="30" rx="8" ry="5" fill="#E8735F" />
      <g class="crab-claw">
        <path d="M-24 4 q-14 -4 -16 -16 q10 -2 14 6" fill="#F08A72" stroke="#E8735F" stroke-width="2" />
      </g>
      <g class="crab-claw crab-claw--right">
        <path d="M24 4 q14 -4 16 -16 q-10 -2 -14 6" fill="#F08A72" stroke="#E8735F" stroke-width="2" />
      </g>
      <circle cx="-1" cy="-10" r="3" fill="#584A42" />
      <circle cx="9" cy="-10" r="3" fill="#584A42" />
      <path d="M-3 -2 q6 5 12 0" fill="none" stroke="#584A42" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="-12" cy="-4" r="3.5" fill="#FFC9B8" opacity="0.6" />
    </g>

    <!-- 小松鼠 -->
    <g v-else-if="kind === 'squirrel'" class="friend" :class="{ 'is-happy': happy }">
      <path d="M24 34 q26 -6 18 -32 q-4 -16 -18 -14 q10 12 2 26 q-8 12 -22 14 z" fill="#C98B4E" />
      <ellipse cx="0" cy="24" rx="22" ry="22" fill="#D9A15E" />
      <ellipse cx="0" cy="28" rx="13" ry="14" fill="#F3DCC6" />
      <ellipse cx="-11" cy="46" rx="10" ry="6" fill="#C98B4E" />
      <ellipse cx="11" cy="46" rx="10" ry="6" fill="#C98B4E" />
      <ellipse cx="-22" cy="16" rx="7" ry="11" fill="#D9A15E" transform="rotate(18 -22 16)" />
      <circle cx="0" cy="-18" r="20" fill="#D9A15E" />
      <circle cx="-14" cy="-34" r="7" fill="#D9A15E" />
      <circle cx="14" cy="-34" r="7" fill="#D9A15E" />
      <circle cx="-14" cy="-34" r="3.4" fill="#F3DCC6" />
      <circle cx="14" cy="-34" r="3.4" fill="#F3DCC6" />
      <ellipse cx="0" cy="-10" rx="10" ry="7" fill="#F3DCC6" />
      <g v-if="happy">
        <path d="M-11 -22 q5 -6 10 0" fill="none" stroke="#584A42" stroke-width="2.8" stroke-linecap="round" />
        <path d="M1 -22 q5 -6 10 0" fill="none" stroke="#584A42" stroke-width="2.8" stroke-linecap="round" />
      </g>
      <g v-else>
        <circle cx="-8" cy="-21" r="2.8" fill="#584A42" />
        <circle cx="8" cy="-21" r="2.8" fill="#584A42" />
      </g>
      <ellipse cx="0" cy="-11" rx="3" ry="2.4" fill="#584A42" />
      <path d="M-4 -6 q4 5 8 0" fill="none" stroke="#584A42" stroke-width="2.2" stroke-linecap="round" />
    </g>

    <!-- 小贝壳 -->
    <g v-else-if="kind === 'shell'" class="friend" :class="{ 'is-happy': happy }">
      <path d="M-24 22 q0 -40 24 -40 q24 0 24 40 z" fill="#FFD9C2" stroke="#F0A88F" stroke-width="3" />
      <path d="M0 -18 v38" stroke="#F0A88F" stroke-width="2.4" />
      <path d="M-12 -10 q-4 18 -6 30" stroke="#F0A88F" stroke-width="2.4" fill="none" />
      <path d="M12 -10 q4 18 6 30" stroke="#F0A88F" stroke-width="2.4" fill="none" />
      <circle cx="0" cy="22" r="5" fill="#F7C6B0" />
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

.crab-claw {
  transform-box: fill-box;
  transform-origin: right bottom;
  animation: claw-snap 3.4s ease-in-out infinite;
}

.crab-claw--right {
  transform-origin: left bottom;
  animation-delay: 0.4s;
}

.crab.is-happy .crab-legs {
  animation: none;
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

@keyframes claw-snap {
  0%,
  80%,
  100% {
    transform: rotate(0deg);
  }
  88% {
    transform: rotate(-12deg);
  }
  94% {
    transform: rotate(4deg);
  }
}
</style>
