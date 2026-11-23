<template>
  <g :transform="`translate(${x} ${y}) scale(${scale})`">
    <ellipse cx="0" cy="92" rx="196" ry="15" fill="#5f9e70" opacity="0.16" />

    <g
      class="bus-body"
      :class="{ 'is-bouncing': fx === 'bounce', 'is-sleeping': eyes === 'sleep' }"
      role="button"
      tabindex="0"
      :aria-label="isFire ? '消防车嘟嘟' : '小巴士嘟嘟'"
      @click="$emit('part', 'bus')"
      @keydown.enter.prevent="$emit('part', 'bus')"
    >
      <!-- 车身 -->
      <rect
        x="-186"
        y="-78"
        width="372"
        height="150"
        rx="44"
        :fill="isFire ? '#E96A5C' : '#F5C24B'"
        :stroke="isFire ? '#C24A3D' : '#E0A93B'"
        stroke-width="4"
      />
      <path
        d="M-168 -70 Q0 -92 168 -70"
        fill="none"
        :stroke="isFire ? '#FFB4A2' : '#FFD97A'"
        stroke-width="7"
        stroke-linecap="round"
        opacity="0.8"
      />
      <!-- 消防车的白色腰线 -->
      <rect v-if="isFire" x="-186" y="14" width="372" height="26" rx="13" fill="#FFF7E6" opacity="0.92" />
      <!-- 消防车的云梯（画在车身之后，支架才不会被车身盖住） -->
      <g v-if="isFire" class="fire-ladder">
        <rect x="-96" y="-122" width="200" height="11" rx="5.5" fill="#E4E8EF" stroke="#C3C9D4" stroke-width="2" />
        <g stroke="#C3C9D4" stroke-width="5">
          <line x1="-70" y1="-121" x2="-70" y2="-92" />
          <line x1="-35" y1="-121" x2="-35" y2="-92" />
          <line x1="0" y1="-121" x2="0" y2="-92" />
          <line x1="35" y1="-121" x2="35" y2="-92" />
          <line x1="70" y1="-121" x2="70" y2="-92" />
        </g>
        <rect x="-96" y="-97" width="200" height="8" rx="4" fill="#D5DAE3" />
        <!-- 两个支架把云梯和车顶连起来 -->
        <rect x="-74" y="-96" width="10" height="22" rx="4" fill="#B4BAC6" />
        <rect x="64" y="-96" width="10" height="22" rx="4" fill="#B4BAC6" />
        <circle cx="-68" cy="-118" r="6" fill="#B4BAC6" />
        <circle cx="76" cy="-118" r="6" fill="#B4BAC6" />
      </g>

      <!-- 车窗 -->
      <g>
        <rect x="-160" y="-54" width="72" height="58" rx="16" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="6" />
        <rect x="-78" y="-54" width="72" height="58" rx="16" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="6" />
        <rect x="4" y="-54" width="72" height="58" rx="16" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="6" />

        <!-- 上车的小伙伴 -->
        <g v-if="friends.rabbit" class="window-friend">
          <circle cx="-124" cy="-18" r="17" fill="#FFF3E6" />
          <ellipse cx="-132" cy="-40" rx="6" ry="16" fill="#FFF3E6" />
          <ellipse cx="-116" cy="-42" rx="6" ry="16" fill="#FFF3E6" />
          <ellipse cx="-132" cy="-40" rx="3" ry="11" fill="#F6BCC4" />
          <ellipse cx="-116" cy="-42" rx="3" ry="11" fill="#F6BCC4" />
          <circle cx="-130" cy="-20" r="2.4" fill="#584A42" />
          <circle cx="-118" cy="-20" r="2.4" fill="#584A42" />
          <circle cx="-124" cy="-13" r="2.6" fill="#EF8B7B" />
        </g>
        <g v-if="friends.bear" class="window-friend">
          <circle cx="-42" cy="-18" r="18" fill="#C99B77" />
          <circle cx="-56" cy="-34" r="8" fill="#C99B77" />
          <circle cx="-28" cy="-34" r="8" fill="#C99B77" />
          <circle cx="-48" cy="-20" r="2.4" fill="#584A42" />
          <circle cx="-36" cy="-20" r="2.4" fill="#584A42" />
          <ellipse cx="-42" cy="-11" rx="6" ry="4.5" fill="#F3DCC6" />
          <circle cx="-42" cy="-12" r="2.4" fill="#584A42" />
        </g>
        <g v-if="friends.duck" class="window-friend">
          <circle cx="40" cy="-18" r="17" fill="#F9DE7A" />
          <ellipse cx="40" cy="-34" rx="10" ry="7" fill="#F9DE7A" />
          <circle cx="34" cy="-20" r="2.4" fill="#584A42" />
          <circle cx="46" cy="-20" r="2.4" fill="#584A42" />
          <ellipse cx="40" cy="-10" rx="8" ry="4.5" fill="#F0A24E" />
        </g>
        <g v-if="friends.turtle" class="window-friend">
          <circle cx="40" cy="-18" r="16" fill="#9ED8B6" />
          <circle cx="34" cy="-20" r="2.2" fill="#584A42" />
          <circle cx="46" cy="-20" r="2.2" fill="#584A42" />
          <path d="M36 -12 q4 4 8 0" fill="none" stroke="#584A42" stroke-width="2" stroke-linecap="round" />
        </g>
        <g v-if="friends.squirrel" class="window-friend">
          <circle cx="-42" cy="-18" r="14" fill="#D9A15E" />
          <circle cx="-52" cy="-30" r="7" fill="#D9A15E" />
          <circle cx="-32" cy="-30" r="7" fill="#D9A15E" />
          <circle cx="-46" cy="-20" r="2.2" fill="#584A42" />
          <circle cx="-38" cy="-20" r="2.2" fill="#584A42" />
          <path d="M-46 -12 q4 4 8 0" fill="none" stroke="#584A42" stroke-width="2" stroke-linecap="round" />
        </g>
      </g>

      <!-- 车门 -->
      <g
        class="bus-door"
        :class="{ 'is-open': doorOpen }"
        role="button"
        tabindex="0"
        aria-label="车门"
        @click.stop="$emit('part', 'door')"
        @keydown.enter.prevent="$emit('part', 'door')"
      >
        <rect x="86" y="-54" width="52" height="116" rx="16" fill="#FFE3A6" stroke="#FFF7E6" stroke-width="5" />
        <rect x="94" y="-46" width="36" height="40" rx="10" fill="#A6D8E9" />
        <rect v-if="doorOpen" x="86" y="-54" width="26" height="116" rx="12" fill="#8A6B4F" opacity="0.55" />
        <rect x="96" y="18" width="30" height="6" rx="3" fill="#E0A93B" />
      </g>

      <!-- 前脸：眼睛 + 微笑 -->
      <g class="bus-face">
        <g v-if="eyes === 'sleep'">
          <path d="M126 -22 q9 8 18 0" fill="none" stroke="#584A42" stroke-width="5" stroke-linecap="round" />
          <path d="M158 -22 q9 8 18 0" fill="none" stroke="#584A42" stroke-width="5" stroke-linecap="round" />
        </g>
        <g v-else-if="eyes === 'happy'">
          <path d="M124 -18 q11 -12 22 0" fill="none" stroke="#584A42" stroke-width="5" stroke-linecap="round" />
          <path d="M156 -18 q11 -12 22 0" fill="none" stroke="#584A42" stroke-width="5" stroke-linecap="round" />
        </g>
        <g v-else>
          <circle cx="135" cy="-18" r="8.5" fill="#584A42" />
          <circle cx="167" cy="-18" r="8.5" fill="#584A42" />
          <circle cx="138" cy="-21" r="3" fill="#FFFDF7" />
          <circle cx="170" cy="-21" r="3" fill="#FFFDF7" />
        </g>
        <circle cx="112" cy="2" r="10" fill="#F19A8C" opacity="0.55" />
        <circle cx="182" cy="2" r="10" fill="#F19A8C" opacity="0.55" />
        <path d="M140 6 q10 12 22 0" fill="none" stroke="#584A42" stroke-width="5" stroke-linecap="round" />
      </g>

      <!-- 车灯 -->
      <g class="headlight" :class="{ 'is-on': lightOn }">
        <circle cx="176" cy="34" r="9" fill="#FFF3C4" stroke="#E0A93B" stroke-width="3" />
        <circle cx="176" cy="34" r="22" fill="#FFF3C4" opacity="0.5" />
      </g>
      <rect x="-180" y="26" width="14" height="14" rx="5" fill="#EF8B7B" />
    </g>

    <!-- 车轮 -->
    <g
      v-for="wheel in wheels"
      :key="wheel.id"
      class="wheel-hit"
      :transform="`translate(${wheel.x} 72)`"
      role="button"
      tabindex="0"
      aria-label="车轮"
      @click.stop="$emit('part', 'wheel')"
      @keydown.enter.prevent="$emit('part', 'wheel')"
    >
      <circle r="37" fill="#4A4038" />
      <circle r="27" fill="#FFF7E6" />
      <g class="wheel-rot" :class="{ 'is-spinning': fx === 'wheel' || moving }">
        <circle r="9" :fill="isFire ? '#C24A3D' : '#E0A93B'" />
        <rect x="-3.5" y="-24" width="7" height="16" rx="3.5" fill="#D9C7A8" />
        <rect x="-3.5" y="8" width="7" height="16" rx="3.5" fill="#D9C7A8" />
        <rect x="-24" y="-3.5" width="16" height="7" rx="3.5" fill="#D9C7A8" />
        <rect x="8" y="-3.5" width="16" height="7" rx="3.5" fill="#D9C7A8" />
      </g>
    </g>
  </g>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  eyes: { type: String, default: 'open' },
  doorOpen: { type: Boolean, default: false },
  lightOn: { type: Boolean, default: true },
  vehicle: { type: String, default: 'bus' },
  friends: {
    type: Object,
    default: () => ({ rabbit: false, bear: false, duck: false, turtle: false, squirrel: false }),
  },
  fx: { type: String, default: '' },
  moving: { type: Boolean, default: false },
})

defineEmits(['part'])

const wheels = [
  { id: 'rear', x: -112 },
  { id: 'front', x: 108 },
]

const isFire = computed(() => props.vehicle === 'firetruck')
</script>

<style scoped>
.bus-body,
.bus-door,
.wheel-hit {
  outline: none;
}

.bus-body:focus-visible,
.bus-door:focus-visible,
.wheel-hit:focus-visible {
  filter: drop-shadow(0 0 14px rgba(239, 139, 123, 0.9));
}

.bus-body {
  transform-box: fill-box;
  transform-origin: center;
  animation: bus-bob 3.8s ease-in-out infinite;
}

.bus-body.is-bouncing {
  animation: bus-bounce 0.62s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bus-body.is-sleeping {
  animation: bus-breathe 5s ease-in-out infinite;
}

.wheel-rot {
  transform-box: fill-box;
  transform-origin: center;
  animation: wheel-spin 2.4s linear infinite;
}

.wheel-rot.is-spinning {
  animation: wheel-spin 0.6s linear 3;
}

.window-friend {
  animation: friend-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-box: fill-box;
  transform-origin: center;
}

.roof-light circle:last-child,
.headlight circle:last-child {
  opacity: 0.15;
  transition: opacity 0.25s ease;
}

.roof-light.is-on circle:last-child,
.headlight.is-on circle:last-child {
  opacity: 0.65;
  animation: light-pulse 2.2s ease-in-out infinite;
}

.siren circle {
  animation: siren-blink 1.1s steps(1, end) infinite;
}

.siren circle:last-child {
  animation-delay: 0.55s;
}

.fire-ladder {
  animation: ladder-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-box: fill-box;
  transform-origin: center bottom;
}

.bus-face,
.headlight {
  pointer-events: none;
}

.bus-door {
  cursor: pointer;
}

.bus-door.is-open {
  transform: translateX(-8px);
  transform-box: fill-box;
}

@keyframes bus-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes bus-bounce {
  0% {
    transform: translateY(0) scale(1);
  }
  35% {
    transform: translateY(-22px) scale(1.02, 0.98);
  }
  65% {
    transform: translateY(2px) scale(0.99, 1.02);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes bus-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.008, 0.995);
  }
}

@keyframes wheel-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes light-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.75;
  }
}

@keyframes friend-pop {
  from {
    transform: scale(0.4) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes siren-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.35;
  }
}

@keyframes ladder-pop {
  from {
    transform: scaleY(0.2);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
