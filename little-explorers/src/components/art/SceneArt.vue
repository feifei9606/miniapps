<template>
  <svg
    class="scene-art"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    :aria-label="ariaLabel"
  >
    <defs>
      <linearGradient :id="skyId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="sky[0]" />
        <stop offset="1" :stop-color="sky[1]" />
      </linearGradient>
      <linearGradient :id="roadId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F1E8D7" />
        <stop offset="1" stop-color="#E1D3BB" />
      </linearGradient>
    </defs>

    <rect width="1000" height="620" :fill="`url(#${skyId})`" />

    <!-- 云朵 -->
    <CloudArt
      v-for="(cloud, index) in clouds"
      :key="`cloud-${index}`"
      :x="cloud.x"
      :y="cloud.y"
      :scale="cloud.scale"
      :opacity="cloud.opacity"
      :delay="index * 1.3"
    />

    <!-- 太阳 / 月亮 -->
    <template v-if="art !== 'rainy-duck'">
      <g
        v-if="sunTappable"
        class="tap"
        role="button"
        tabindex="0"
        aria-label="太阳公公"
        @click="tap('sun')"
        @keydown.enter.prevent="tap('sun')"
      >
        <SunArt
          :x="sunPos.x"
          :y="flags.sun_set ? sunPos.y + 74 : sunPos.y"
          :scale="sunPos.scale"
          :happy="fx === 'sun' || flags.sun_set"
          :opacity="flags.sun_set ? 0.55 : 1"
        />
      </g>
      <SunArt
        v-else
        :x="sunPos.x"
        :y="sunPos.y"
        :scale="sunPos.scale"
        :happy="fx === 'sun'"
      />
    </template>

    <!-- 夜晚的月亮与星星 -->
    <template v-if="isNight">
      <SunArt :x="140" :y="110" :scale="0.82" moon />
      <g class="stars">
        <g v-for="(star, index) in stars" :key="`star-${index}`" :style="{ animationDelay: `${index * 0.45}s` }">
          <circle :cx="star.x" :cy="star.y" :r="star.r" fill="#FFF6D8" />
        </g>
      </g>
      <g
        class="tap star-hit"
        role="button"
        tabindex="0"
        aria-label="星星"
        @click="tap('star')"
        @keydown.enter.prevent="tap('star')"
      >
        <circle cx="660" cy="81" r="40" fill="transparent" />
        <path
          d="M660 56 l7 18 19 1 -15 12 5 19 -16 -11 -16 11 5 -19 -15 -12 19 -1 z"
          fill="#FFE9A3"
          class="twinkle"
        />
      </g>
    </template>

    <!-- 远山与地面 -->
    <path :d="hillBack" :fill="hills.back" />
    <path :d="hillFront" :fill="hills.front" />

    <template v-if="hasRoad">
      <rect x="0" y="440" width="1000" height="180" :fill="`url(#${roadId})`" />
      <rect x="0" y="432" width="1000" height="14" fill="#D9CDB4" />
      <g class="road-dashes">
        <rect
          v-for="i in 7"
          :key="`dash-${i}`"
          :x="i * 150 - 62"
          y="548"
          width="80"
          height="9"
          rx="4.5"
          fill="#FFFDF7"
          opacity="0.85"
        />
      </g>
    </template>
    <path
      v-else
      d="M0 468 Q250 428 520 468 T1000 458 L1000 620 L0 620 Z"
      :fill="hills.grass"
    />

    <!-- ============ 封面 ============ -->
    <g v-if="art === 'cover'">
      <BusArt
        :x="500"
        :y="368"
        :scale="1.08"
        eyes="happy"
        :light-on="true"
        :friends="{ rabbit: true, bear: true, duck: true }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
      <FriendArt kind="rabbit" :x="214" :y="404" :scale="0.92" happy />
      <FriendArt kind="duck" :x="812" :y="414" :scale="0.88" happy />
      <FlowerArt :x="120" :y="486" :scale="0.9" color="#F6BCC4" />
      <FlowerArt :x="900" :y="500" :scale="0.8" color="#F7C64B" />
      <FlowerArt :x="760" :y="530" :scale="0.7" color="#B9A6D9" />
      <g class="balloons">
        <line x1="700" y1="270" x2="700" y2="350" stroke="#C99B77" stroke-width="2.5" />
        <circle cx="700" cy="244" r="24" fill="#EF8B7B" />
        <line x1="742" y1="300" x2="742" y2="360" stroke="#C99B77" stroke-width="2.5" />
        <circle cx="742" cy="276" r="20" fill="#8FC7E8" />
      </g>
    </g>

    <!-- ============ 第 1 页：早上好 ============ -->
    <g v-else-if="art === 'morning'">
      <BusArt
        :x="520"
        :y="368"
        :scale="1.05"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :fx="fx === 'bus' ? 'bounce' : fx === 'wheel' ? 'wheel' : ''"
        @part="onBusPart"
      />
      <FlowerArt :x="864" :y="476" :scale="1" color="#F6BCC4" />
      <FlowerArt :x="112" :y="494" :scale="0.85" color="#F7C64B" />
      <FlowerArt :x="756" :y="516" :scale="0.7" color="#B9A6D9" />
      <FlowerArt :x="930" :y="520" :scale="0.75" color="#EF8B7B" />
      <g class="grass-tufts">
        <path d="M60 500 q6 -20 12 0 M74 504 q6 -16 12 0" stroke="#7FBC84" stroke-width="4" fill="none" stroke-linecap="round" />
        <path d="M820 480 q6 -20 12 0 M834 484 q6 -16 12 0" stroke="#7FBC84" stroke-width="4" fill="none" stroke-linecap="round" />
      </g>
      <FriendArt kind="bird" :x="330" :y="190" :scale="0.9" />
    </g>

    <!-- ============ 第 2 页：去接小兔子 ============ -->
    <g v-else-if="art === 'rabbit-stop'">
      <g class="bus-stop">
        <rect x="792" y="342" width="8" height="98" rx="4" fill="#A9835F" />
        <rect x="758" y="300" width="76" height="56" rx="16" fill="#FFFDF7" stroke="#EF8B7B" stroke-width="5" />
        <path d="M796 330 q-14 -14 -18 2 q10 8 18 -2 q8 10 18 2 q-4 -16 -18 -2" fill="#EF8B7B" />
      </g>
      <BusArt
        :x="300"
        :y="368"
        :scale="1"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :door-open="!flags.rabbit_boarded"
        :light-on="true"
        :friends="{ rabbit: !!flags.rabbit_boarded, bear: false, duck: false }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
      <g
        v-if="!flags.rabbit_boarded"
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小兔子"
        @click="tap('rabbit')"
        @keydown.enter.prevent="tap('rabbit')"
      >
        <FriendArt kind="rabbit" :x="672" :y="318" :scale="1.05" :happy="fx === 'rabbit'" />
      </g>
      <g
        v-else
        class="rabbit-cheer"
        aria-hidden="true"
      >
        <FriendArt kind="rabbit" :x="672" :y="318" :scale="1.05" happy />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小花"
        @click="tap('flower')"
        @keydown.enter.prevent="tap('flower')"
      >
        <FlowerArt :x="900" :y="500" :scale="0.95" color="#F6BCC4" :bloom="fx === 'flower'" />
      </g>
      <ellipse cx="660" cy="432" rx="52" ry="16" fill="#8CC98A" />
      <ellipse cx="700" cy="438" rx="40" ry="13" fill="#A8D39A" />
    </g>

    <!-- ============ 第 3 页：小熊在哪里 ============ -->
    <g v-else-if="art === 'bear-hide'">
      <BusArt
        :x="66"
        :y="392"
        :scale="0.66"
        eyes="open"
        :light-on="true"
        :friends="{ rabbit: true, bear: !!flags.bear_found, duck: false }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />

      <g
        v-if="!flags.bear_found"
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小熊"
        @click="tap('bear')"
        @keydown.enter.prevent="tap('bear')"
      >
        <FriendArt kind="bear" :x="682" :y="344" :scale="0.98" :happy="fx === 'bear'" />
      </g>
      <!-- 小熊藏身的大灌木：挡在身前，只露出耳朵和眼睛 -->
      <g class="hide-bush" pointer-events="none">
        <ellipse cx="682" cy="398" rx="96" ry="52" fill="#8CC98A" />
        <ellipse cx="632" cy="404" rx="34" ry="24" fill="#A8D39A" />
        <ellipse cx="730" cy="406" rx="32" ry="22" fill="#A8D39A" />
        <circle cx="648" cy="380" r="5" fill="#F7C64B" />
        <circle cx="714" cy="390" r="4" fill="#F7C64B" />
      </g>

      <g v-if="flags.bear_found">
        <FriendArt kind="bear" :x="800" :y="340" :scale="1.05" happy />
        <path d="M816 304 q6 -12 14 -4" stroke="#F7C64B" stroke-width="4" fill="none" stroke-linecap="round" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="大树"
        @click="tap('tree')"
        @keydown.enter.prevent="tap('tree')"
      >
        <TreeArt :x="552" :y="438" :scale="1.05" />
      </g>
      <TreeArt :x="888" :y="446" :scale="0.8" :delay="1.2" />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小花"
        @click="tap('flower')"
        @keydown.enter.prevent="tap('flower')"
      >
        <FlowerArt :x="200" :y="474" :scale="0.95" color="#F7C64B" :bloom="fx === 'flower'" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小石头"
        @click="tap('rock')"
        @keydown.enter.prevent="tap('rock')"
      >
        <ellipse cx="380" cy="492" rx="56" ry="30" fill="#B9AE9B" />
        <ellipse cx="366" cy="482" rx="30" ry="16" fill="#CFC5B2" />
        <g v-if="fx === 'rock'" class="bug">
          <ellipse cx="392" cy="472" rx="7" ry="5" fill="#E3695F" />
          <circle cx="389" cy="470" r="1.6" fill="#584A42" />
          <line x1="386" y1="468" x2="382" y2="462" stroke="#584A42" stroke-width="1.5" />
          <line x1="398" y1="468" x2="402" y2="462" stroke="#584A42" stroke-width="1.5" />
        </g>
      </g>

      <g class="mushrooms">
        <ellipse cx="290" cy="516" rx="18" ry="9" fill="#EF8B7B" />
        <rect x="287" y="514" width="6" height="14" fill="#FFF3E6" />
        <ellipse cx="828" cy="522" rx="14" ry="7" fill="#EF8B7B" />
        <rect x="825" y="520" width="5" height="12" fill="#FFF3E6" />
      </g>
    </g>

    <!-- ============ 第 4 页：红绿灯 ============ -->
    <g v-else-if="art === 'traffic-light'">
      <g class="zebra">
        <rect v-for="i in 6" :key="`zebra-${i}`" :x="104 + i * 30" y="444" width="18" height="118" fill="#FFFDF7" opacity="0.8" />
      </g>
      <g aria-label="红绿灯">
        <TrafficLightArt :x="248" :y="150" :scale="0.8" :light="light" @lamp="onLamp" />
      </g>
      <BusArt
        :x="light === 'green' ? 758 : 690"
        :y="368"
        :scale="0.95"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :friends="{ rabbit: true, bear: true, duck: false }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        :moving="light === 'green'"
        @part="onBusPart"
      />
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸟"
        @click="tap('bird')"
        @keydown.enter.prevent="tap('bird')"
      >
        <FriendArt kind="bird" :x="812" :y="150" :scale="1" :happy="fx === 'bird'" />
      </g>
      <TreeArt :x="430" :y="436" :scale="0.72" :delay="0.8" />
      <TreeArt :x="940" :y="446" :scale="0.65" :delay="1.6" />
      <FlowerArt :x="90" :y="500" :scale="0.8" color="#F6BCC4" />
      <FlowerArt :x="960" :y="510" :scale="0.7" color="#F7C64B" />
    </g>

    <!-- ============ 第 5 页：下雨和小鸭子 ============ -->
    <g v-else-if="art === 'rainy-duck'">
      <g
        class="tap rain-layer"
        role="button"
        tabindex="0"
        aria-label="雨滴"
        @click="tap('rain')"
        @keydown.enter.prevent="tap('rain')"
      >
        <line
          v-for="(drop, index) in drops"
          :key="`drop-${index}`"
          :x1="drop.x"
          :y1="drop.y"
          :x2="drop.x - 3"
          :y2="drop.y + drop.len"
          stroke="#9DC6DA"
          stroke-width="4"
          stroke-linecap="round"
          class="raindrop"
          :style="{ animationDelay: `${drop.delay}s`, animationDuration: `${drop.speed}s` }"
        />
      </g>

      <ellipse cx="250" cy="512" rx="70" ry="16" fill="#9DC6DA" opacity="0.5" />
      <ellipse cx="850" cy="520" rx="58" ry="13" fill="#9DC6DA" opacity="0.45" />

      <BusArt
        :x="656"
        :y="368"
        :scale="1"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :door-open="!flags.duck_boarded"
        :light-on="true"
        :friends="busFriends"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="雨伞"
        @click="tap('umbrella')"
        @keydown.enter.prevent="tap('umbrella')"
      >
        <UmbrellaArt :x="300" :y="322" :scale="1" :open="!!flags.umbrella_open" />
      </g>

      <g
        v-if="!flags.duck_boarded"
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸭子"
        @click="tap('duck')"
        @keydown.enter.prevent="tap('duck')"
      >
        <FriendArt kind="duck" :x="344" :y="388" :scale="0.95" :happy="fx === 'duck'" />
      </g>

      <g class="count-hotspots">
        <circle
          v-for="spot in countSpots"
          :key="spot.id"
          :cx="spot.x"
          :cy="spot.y"
          r="34"
          fill="transparent"
          class="tap"
          role="button"
          tabindex="0"
          :aria-label="spot.label"
          @click="tap(spot.id)"
          @keydown.enter.prevent="tap(spot.id)"
        />
      </g>

      <FlowerArt :x="120" :y="500" :scale="0.8" color="#F6BCC4" />
      <ellipse cx="540" cy="512" rx="34" ry="9" fill="#9DC6DA" opacity="0.55" />
    </g>

    <!-- ============ 第 6 页：彩虹 ============ -->
    <g v-else-if="art === 'rainbow'">
      <RainbowArt
        :x="500"
        :y="392"
        :scale="1"
        :lit="{ red: !!flags.color_red, yellow: !!flags.color_yellow, blue: !!flags.color_blue }"
        @color="onRainbowColor"
      />
      <BusArt
        :x="520"
        :y="368"
        :scale="1"
        eyes="happy"
        :light-on="true"
        :friends="{ rabbit: true, bear: true, duck: true }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
      <ellipse cx="180" cy="520" rx="62" ry="14" fill="#9DC6DA" opacity="0.45" />
      <ellipse cx="880" cy="534" rx="48" ry="11" fill="#9DC6DA" opacity="0.4" />
      <FlowerArt :x="120" :y="500" :scale="0.85" color="#F7C64B" />
      <FlowerArt :x="920" :y="510" :scale="0.75" color="#F6BCC4" />
      <FriendArt kind="bird" :x="250" :y="250" :scale="0.8" />
      <FriendArt kind="bird" :x="770" :y="280" :scale="0.7" />
    </g>

    <!-- ============ 第 7 页：公园 ============ -->
    <g v-else-if="art === 'park'">
      <TreeArt :x="104" :y="440" :scale="0.95" />
      <TreeArt :x="918" :y="430" :scale="0.9" :delay="1.1" />
      <BusArt
        :x="170"
        :y="356"
        :scale="0.82"
        eyes="happy"
        :door-open="true"
        :light-on="true"
        :friends="{ rabbit: false, bear: false, duck: false }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />

      <g class="picnic">
        <path d="M432 502 L688 502 L724 562 L396 562 Z" fill="#FFFDF7" />
        <path d="M432 502 L688 502 L694 516 L426 516 Z" fill="#F6BCC4" opacity="0.85" />
        <path d="M418 536 L702 536 L707 548 L413 548 Z" fill="#F6BCC4" opacity="0.6" />
        <path d="M464 516 L446 562 M540 516 L532 562 M616 516 L628 562" stroke="#F6BCC4" stroke-width="8" opacity="0.5" />
        <rect x="596" y="470" width="54" height="34" rx="9" fill="#C99B77" />
        <path d="M596 482 q27 -20 54 0" fill="none" stroke="#A9835F" stroke-width="4" />
        <path d="M614 470 q12 -24 26 0" fill="#A9835F" />
        <circle cx="516" cy="498" r="11" fill="#F7C64B" />
        <circle cx="546" cy="506" r="9" fill="#E3695F" />
        <circle cx="478" cy="508" r="8" fill="#7FBC84" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小兔子"
        @click="tap('rabbit')"
        @keydown.enter.prevent="tap('rabbit')"
      >
        <FriendArt kind="rabbit" :x="382" :y="382" :scale="1.05" :happy="fx === 'rabbit'" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小熊"
        @click="tap('bear')"
        @keydown.enter.prevent="tap('bear')"
      >
        <FriendArt kind="bear" :x="552" :y="386" :scale="1.08" :happy="fx === 'bear'" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸭子"
        @click="tap('duck')"
        @keydown.enter.prevent="tap('duck')"
      >
        <FriendArt kind="duck" :x="730" :y="392" :scale="1" :happy="fx === 'duck'" />
      </g>

      <g class="balloons">
        <line x1="840" y1="300" x2="840" y2="380" stroke="#C99B77" stroke-width="2.5" />
        <circle cx="840" cy="272" r="22" fill="#B9A6D9" />
        <line x1="878" y1="326" x2="878" y2="392" stroke="#C99B77" stroke-width="2.5" />
        <circle cx="878" cy="300" r="18" fill="#F7C64B" />
      </g>
      <FlowerArt :x="300" :y="500" :scale="0.8" color="#F6BCC4" />
      <FlowerArt :x="820" :y="512" :scale="0.85" color="#EF8B7B" />
    </g>

    <!-- ============ 第 8 页：晚安 ============ -->
    <g v-else-if="art === 'goodnight'">
      <g class="fireflies">
        <circle cx="220" cy="330" r="4" fill="#FFF3A8" />
        <circle cx="300" cy="300" r="3" fill="#FFF3A8" />
        <circle cx="820" cy="360" r="3.5" fill="#FFF3A8" />
        <circle cx="900" cy="420" r="3" fill="#FFF3A8" />
      </g>
      <BusArt
        :x="462"
        :y="372"
        :scale="0.95"
        eyes="sleep"
        :light-on="false"
        :friends="{ rabbit: false, bear: false, duck: false }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
      <FriendArt kind="rabbit" :x="712" :y="424" :scale="0.8" happy />
      <FriendArt kind="bear" :x="790" :y="428" :scale="0.82" happy />
      <FriendArt kind="duck" :x="862" :y="436" :scale="0.78" happy />
      <FlowerArt :x="120" :y="520" :scale="0.75" color="#B9A6D9" />
      <FlowerArt :x="960" :y="520" :scale="0.7" color="#F6BCC4" />
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import BusArt from './BusArt.vue'
import FriendArt from './FriendArt.vue'
import SunArt from './SunArt.vue'
import CloudArt from './CloudArt.vue'
import FlowerArt from './FlowerArt.vue'
import TreeArt from './TreeArt.vue'
import TrafficLightArt from './TrafficLightArt.vue'
import UmbrellaArt from './UmbrellaArt.vue'
import RainbowArt from './RainbowArt.vue'

const props = defineProps({
  art: { type: String, default: 'morning' },
  flags: { type: Object, default: () => ({}) },
  light: { type: String, default: '' },
  fx: { type: String, default: '' },
  viewBox: { type: String, default: '0 0 1000 620' },
})

const emit = defineEmits(['interact'])

const uid = `scene-${Math.random().toString(36).slice(2, 8)}`
const skyId = `${uid}-sky`
const roadId = `${uid}-road`

const SKIES = {
  cover: ['#FFE9C9', '#FFD8B4'],
  morning: ['#FFF0D6', '#FFE0BE'],
  'rabbit-stop': ['#DFF3FA', '#EFF9E6'],
  'bear-hide': ['#DFF3F0', '#F1F9DD'],
  'traffic-light': ['#DCEFF8', '#F4F9E4'],
  'rainy-duck': ['#BFD6E4', '#DCE9EA'],
  rainbow: ['#D8EEF9', '#FFF3D6'],
  park: ['#D9F0FA', '#EDF9DC'],
  goodnight: ['#6E6696', '#F3B49B'],
}

const sky = computed(() => SKIES[props.art] || SKIES.morning)
const isNight = computed(() => props.art === 'goodnight')

const hills = computed(() =>
  isNight.value
    ? { back: '#6E7F86', front: '#5A7263', grass: '#4F6B57' }
    : { back: '#C4E2B4', front: '#A8D39A', grass: '#8CC98A' },
)

const hillBack = 'M0 440 Q150 360 330 420 T660 410 T1000 430 L1000 620 L0 620 Z'
const hillFront = 'M0 486 Q220 436 470 484 T1000 470 L1000 620 L0 620 Z'

const hasRoad = computed(() =>
  ['cover', 'morning', 'rabbit-stop', 'traffic-light', 'rainy-duck', 'rainbow'].includes(props.art),
)

const sunPositions = {
  cover: { x: 168, y: 120, scale: 0.95 },
  morning: { x: 170, y: 112, scale: 1 },
  'rabbit-stop': { x: 846, y: 92, scale: 0.78 },
  'bear-hide': { x: 132, y: 108, scale: 0.82 },
  'traffic-light': { x: 82, y: 84, scale: 0.72 },
  rainbow: { x: 118, y: 92, scale: 0.92 },
  park: { x: 862, y: 96, scale: 0.88 },
  goodnight: { x: 820, y: 286, scale: 0.78 },
}

const sunPos = computed(() => sunPositions[props.art] || sunPositions.morning)
const sunTappable = computed(() => ['morning', 'rainbow', 'goodnight'].includes(props.art))

const clouds = computed(() => {
  if (props.art === 'rainy-duck') {
    return [
      { x: 200, y: 86, scale: 1.05, opacity: 0.85 },
      { x: 520, y: 62, scale: 1.15, opacity: 0.9 },
      { x: 846, y: 104, scale: 0.95, opacity: 0.8 },
    ]
  }
  if (props.art === 'goodnight') {
    return [
      { x: 220, y: 130, scale: 0.8, opacity: 0.22 },
      { x: 760, y: 150, scale: 0.7, opacity: 0.18 },
    ]
  }
  return [
    { x: 300, y: 120, scale: 0.82, opacity: 0.92 },
    { x: 790, y: 158, scale: 0.68, opacity: 0.85 },
  ]
})

const stars = [
  { x: 120, y: 70, r: 4 },
  { x: 250, y: 140, r: 3 },
  { x: 360, y: 62, r: 2.6 },
  { x: 540, y: 96, r: 3.6 },
  { x: 600, y: 50, r: 2.4 },
  { x: 720, y: 140, r: 2.6 },
  { x: 880, y: 76, r: 3.4 },
  { x: 946, y: 160, r: 2.4 },
  { x: 62, y: 186, r: 2.6 },
]

const drops = Array.from({ length: 20 }, (_, index) => ({
  x: (index * 53 + 24) % 960,
  y: (index * 37) % 360,
  len: 16 + (index % 3) * 6,
  delay: (index % 7) * 0.16,
  speed: 0.9 + (index % 4) * 0.12,
}))

const busFriends = computed(() => ({
  rabbit: !!props.flags.rabbit_boarded,
  bear: !!props.flags.bear_found,
  duck: !!props.flags.duck_boarded,
}))

const countSpots = [
  { id: 'count-rabbit', label: '数一数小兔子', x: 532, y: 344 },
  { id: 'count-bear', label: '数一数小熊', x: 614, y: 344 },
  { id: 'count-duck', label: '数一数小鸭子', x: 696, y: 344 },
]

const ariaLabels = {
  cover: '小巴士嘟嘟和好朋友们',
  morning: '早上的小路，太阳和小巴士嘟嘟',
  'rabbit-stop': '小兔子在车站等嘟嘟',
  'bear-hide': '森林里，小熊躲在灌木后面',
  'traffic-light': '路口有一个红绿灯',
  'rainy-duck': '下雨了，小鸭子躲在雨伞下',
  rainbow: '雨停了，天上出现彩虹',
  park: '大家来到公园野餐',
  goodnight: '晚上了，嘟嘟和朋友们说晚安',
}

const ariaLabel = computed(() => ariaLabels[props.art] || '故事画面')

function tap(id) {
  emit('interact', id)
}

function onBusPart(part) {
  if (part === 'wheel') tap('wheel')
  else if (part === 'door') tap('door')
  else tap('bus')
}

function onLamp(color) {
  tap(color)
}

function onRainbowColor(color) {
  tap(`rainbow-${color}`)
}
</script>

<style scoped>
.scene-art {
  display: block;
  width: 100%;
  height: 100%;
}

.tap {
  cursor: pointer;
  outline: none;
}

/* 用柔和光晕表示键盘焦点。默认的实线 outline 会套住整个 SVG 组，
   在绘本画面里非常突兀，改用 filter 更贴合插画风。 */
.tap:focus-visible {
  filter: drop-shadow(0 0 16px rgba(239, 139, 123, 0.95));
}

.raindrop {
  animation: rain-fall 1s linear infinite;
}

.stars > g {
  transform-box: fill-box;
  transform-origin: center;
  animation: star-twinkle 3.2s ease-in-out infinite;
}

.twinkle {
  transform-box: fill-box;
  transform-origin: center;
  animation: star-twinkle 2.4s ease-in-out infinite;
}

.fireflies circle {
  animation: firefly 3.4s ease-in-out infinite;
}

.fireflies circle:nth-child(2) {
  animation-delay: 0.9s;
}

.fireflies circle:nth-child(3) {
  animation-delay: 1.6s;
}

.fireflies circle:nth-child(4) {
  animation-delay: 2.2s;
}

.bug {
  animation: bug-wiggle 1.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes rain-fall {
  0% {
    transform: translateY(-24px);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translateY(60px);
    opacity: 0.2;
  }
}

@keyframes star-twinkle {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes firefly {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
}

@keyframes bug-wiggle {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg);
  }
}
</style>
