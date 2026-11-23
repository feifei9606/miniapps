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
      <linearGradient :id="seaId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8FC7E8" />
        <stop offset="1" stop-color="#B9E0F1" />
      </linearGradient>
      <linearGradient :id="sandId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F7E3BE" />
        <stop offset="1" stop-color="#EFD3A4" />
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
    <template v-if="!isNight">
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
          :y="sunPos.y"
          :scale="sunPos.scale"
          :happy="fx === 'sun' || !!flags.sun_set"
          :opacity="flags.sun_set ? 0.7 : 1"
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
      <SunArt :x="150" :y="110" :scale="0.86" moon />
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
        <circle cx="660" cy="81" r="44" fill="transparent" />
        <path
          d="M660 52 l8 20 21 1 -17 13 6 21 -18 -12 -18 12 6 -21 -17 -13 21 -1 z"
          fill="#FFE9A3"
          class="twinkle"
        />
      </g>
    </template>

    <!-- 远景：海 / 山 -->
    <template v-if="isBeach">
      <path d="M0 372 Q220 352 470 372 T1000 362 L1000 470 L0 470 Z" fill="#7BBEDF" opacity="0.75" />
      <rect x="0" y="392" width="1000" height="86" :fill="`url(#${seaId})`" />
      <g class="waves">
        <path d="M0 430 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="#FFFDF7" stroke-width="5" stroke-linecap="round" opacity="0.75" />
        <path d="M0 456 q40 -12 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="#FFFDF7" stroke-width="4" stroke-linecap="round" opacity="0.45" />
      </g>
      <path d="M0 468 Q250 446 520 470 T1000 452 L1000 620 L0 620 Z" :fill="`url(#${sandId})`" />
    </template>
    <template v-else>
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
    </template>

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

    <!-- ============ 早上醒来：嘟嘟的家 ============ -->
    <g v-else-if="art === 'wake-up'">
      <!-- 房子 -->
      <g>
        <rect x="742" y="286" width="212" height="164" rx="18" fill="#FFF0DA" stroke="#E3C6A4" stroke-width="4" />
        <path d="M726 292 L848 202 L970 292 Z" fill="#EF8B7B" />
        <path d="M726 292 L848 202 L970 292 Z" fill="none" stroke="#D9675D" stroke-width="4" />
        <rect x="800" y="352" width="62" height="98" rx="10" fill="#B9DCE8" stroke="#E3C6A4" stroke-width="4" />
        <circle cx="850" cy="404" r="5" fill="#E0A93B" />
        <rect x="880" y="318" width="46" height="46" rx="9" fill="#A6D8E9" stroke="#E3C6A4" stroke-width="4" />
        <path d="M903 318 v46 M880 341 h46" stroke="#E3C6A4" stroke-width="3" />
      </g>
      <BusArt
        :x="380"
        :y="372"
        :scale="1"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="!!flags.bus_awake"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : fx === 'wheel' ? 'wheel' : ''"
        @part="onBusPart"
      />
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="云朵"
        @click="tap('cloud')"
        @keydown.enter.prevent="tap('cloud')"
      >
        <CloudArt :x="250" :y="132" :scale="1" :opacity="0.95" />
      </g>
      <FlowerArt :x="150" :y="498" :scale="0.95" color="#F6BCC4" />
      <FlowerArt :x="240" :y="522" :scale="0.75" color="#F7C64B" />
      <FriendArt kind="bird" :x="640" :y="196" :scale="0.85" />
    </g>

    <!-- ============ 岔路口：森林还是海边 ============ -->
    <g v-else-if="art === 'fork'">
      <!-- 两条岔路：一条往森林，一条往海边 -->
      <path d="M470 600 Q430 500 300 452 Q200 418 120 400 L96 372 Q230 392 336 442 Q470 496 512 600 Z" fill="#E1D3BB" opacity="0.9" />
      <path d="M540 600 Q590 496 700 452 Q800 414 910 398 L934 372 Q800 388 690 434 Q570 486 520 600 Z" fill="#F2E2C4" opacity="0.95" />
      <path d="M470 600 Q430 500 300 452 Q200 418 120 400" fill="none" stroke="#CDBA9B" stroke-width="4" stroke-dasharray="16 14" opacity="0.75" />
      <path d="M540 600 Q590 496 700 452 Q800 418 910 398" fill="none" stroke="#DCC7A2" stroke-width="4" stroke-dasharray="16 14" opacity="0.75" />

      <BusArt
        :x="500"
        :y="392"
        :scale="0.92"
        eyes="open"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
      <!-- 左边森林 -->
      <g>
        <TreeArt :x="120" :y="392" :scale="0.86" />
        <TreeArt :x="218" :y="418" :scale="0.7" :delay="1" />
        <FriendArt kind="bird" :x="150" :y="272" :scale="0.72" />
      </g>
      <!-- 路口两边的木牌：画着图标，孩子不用认字也知道走哪边（位置要留在手机取景框内） -->
      <g class="fork-sign">
        <rect x="188" y="492" width="9" height="72" rx="4.5" fill="#A9835F" />
        <rect x="140" y="452" width="104" height="44" rx="12" fill="#FFF3D9" stroke="#C99B77" stroke-width="3" />
        <text x="192" y="484" font-size="26" text-anchor="middle" fill="#4E7A57">🌲</text>
      </g>
      <g class="fork-sign">
        <rect x="800" y="492" width="9" height="72" rx="4.5" fill="#A9835F" />
        <rect x="752" y="452" width="104" height="44" rx="12" fill="#EAF6FB" stroke="#7BB7CF" stroke-width="3" />
        <text x="804" y="484" font-size="26" text-anchor="middle" fill="#3E7FA8">🌊</text>
      </g>
      <FlowerArt :x="330" :y="546" :scale="0.62" color="#F6BCC4" />
    </g>

    <!-- ============ 森林 1：森林里的声音 ============ -->
    <g v-else-if="art === 'forest-1'">
      <TreeArt :x="140" :y="438" :scale="1.05" />
      <TreeArt :x="392" :y="452" :scale="0.82" :delay="0.9" />
      <TreeArt :x="856" :y="444" :scale="0.95" :delay="1.7" />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸟"
        @click="tap('bird')"
        @keydown.enter.prevent="tap('bird')"
      >
        <FriendArt kind="bird" :x="150" :y="316" :scale="0.95" :happy="fx === 'bird'" />
        <g v-if="fx === 'bird'" class="notes">
          <text x="186" y="286" font-size="26" fill="#7FBC84">♪</text>
          <text x="206" y="258" font-size="20" fill="#F7C64B">♫</text>
        </g>
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="大树"
        @click="tap('tree')"
        @keydown.enter.prevent="tap('tree')"
      >
        <TreeArt :x="560" :y="436" :scale="1" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="蘑菇"
        @click="tap('mushroom')"
        @keydown.enter.prevent="tap('mushroom')"
      >
        <g :class="{ 'is-wobbling': fx === 'mushroom' }">
          <ellipse cx="404" cy="510" rx="26" ry="14" fill="#EF8B7B" />
          <rect x="398" y="508" width="12" height="24" rx="5" fill="#FFF3E6" />
          <circle cx="396" cy="504" r="4" fill="#FFF3E6" />
          <circle cx="414" cy="508" r="3" fill="#FFF3E6" />
          <ellipse cx="452" cy="518" rx="18" ry="10" fill="#EF8B7B" />
          <rect x="448" y="516" width="9" height="18" rx="4" fill="#FFF3E6" />
        </g>
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小松鼠"
        @click="tap('squirrel')"
        @keydown.enter.prevent="tap('squirrel')"
      >
        <FriendArt kind="squirrel" :x="656" :y="440" :scale="0.86" :happy="fx === 'squirrel'" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小花"
        @click="tap('flower')"
        @keydown.enter.prevent="tap('flower')"
      >
        <FlowerArt :x="272" :y="504" :scale="0.9" color="#F6BCC4" :bloom="fx === 'flower'" />
      </g>

      <BusArt
        :x="846"
        :y="380"
        :scale="0.66"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
    </g>

    <!-- ============ 森林 2：找不到家的小兔子 ============ -->
    <g v-else-if="art === 'forest-2'">
      <TreeArt :x="196" :y="438" :scale="0.92" />
      <TreeArt :x="900" :y="446" :scale="0.88" :delay="1.2" />
      <!-- 大树画在嘟嘟后面，看起来像车停在大树下 -->
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="大树"
        @click="tap('tree')"
        @keydown.enter.prevent="tap('tree')"
      >
        <TreeArt :x="470" :y="452" :scale="0.78" :delay="0.6" />
      </g>

      <!-- 小兔子的家：藏在大树后面，点一点就能发现 -->
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小兔子的家"
        @click="tap('rabbit-home')"
        @keydown.enter.prevent="tap('rabbit-home')"
      >
        <g v-if="flags.rabbit_home" class="home-reveal">
          <rect x="700" y="388" width="126" height="104" rx="14" fill="#FFE9C9" stroke="#C99B77" stroke-width="4" />
          <path d="M686 392 L763 330 L840 392 Z" fill="#B9DCE8" stroke="#8FC7E8" stroke-width="4" />
          <rect x="736" y="428" width="54" height="64" rx="8" fill="#E7A96B" />
          <circle cx="780" cy="460" r="4" fill="#8A6B4F" />
          <circle cx="763" cy="356" r="6" fill="#FFF3E6" />
        </g>
        <g v-else class="home-hidden">
          <rect x="712" y="398" width="112" height="96" rx="12" fill="#EBC48F" stroke="#C99B77" stroke-width="3" opacity="0.9" />
          <path d="M698 400 L768 348 L838 400 Z" fill="#C08A6A" stroke="#9C6B4E" stroke-width="3" opacity="0.95" />
          <rect x="742" y="430" width="52" height="64" rx="7" fill="#D79A6D" opacity="0.9" />
          <!-- 挡住一半的树丛：藏起来的小房子，点一下才发现 -->
          <circle cx="706" cy="470" r="34" fill="#7FBC84" />
          <circle cx="742" cy="486" r="30" fill="#8CC98A" />
          <circle cx="836" cy="474" r="30" fill="#7FBC84" />
          <circle cx="806" cy="492" r="26" fill="#8CC98A" />
        </g>
        <!-- 透明的点击区，保证小小的房子也好点 -->
        <rect x="680" y="320" width="170" height="180" fill="transparent" />
      </g>

      <BusArt
        :x="360"
        :y="384"
        :scale="0.86"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小兔子"
        @click="tap('rabbit')"
        @keydown.enter.prevent="tap('rabbit')"
      >
        <FriendArt
          :kind="'rabbit'"
          :x="flags.rabbit_home ? 610 : 596"
          :y="flags.rabbit_home ? 372 : 392"
          :scale="0.9"
          :happy="!!flags.rabbit_home || fx === 'rabbit'"
        />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="大石头"
        @click="tap('rock')"
        @keydown.enter.prevent="tap('rock')"
      >
        <ellipse cx="220" cy="514" rx="52" ry="28" fill="#B9AE9B" />
        <ellipse cx="208" cy="504" rx="28" ry="15" fill="#CFC5B2" />
        <g v-if="fx === 'rock'" class="bug">
          <ellipse cx="232" cy="494" rx="7" ry="5" fill="#E3695F" />
          <circle cx="229" cy="492" r="1.6" fill="#584A42" />
        </g>
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小花"
        @click="tap('flower')"
        @keydown.enter.prevent="tap('flower')"
      >
        <FlowerArt :x="120" :y="496" :scale="0.8" color="#F7C64B" :bloom="fx === 'flower'" />
      </g>
    </g>

    <!-- ============ 森林 3：树上的小松果 ============ -->
    <g v-else-if="art === 'forest-3'">
      <TreeArt :x="520" :y="446" :scale="1.35" />
      <TreeArt :x="120" :y="446" :scale="0.8" :delay="1.4" />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小松果"
        @click="tap('pinecone')"
        @keydown.enter.prevent="tap('pinecone')"
      >
        <g :class="{ 'is-shaking': fx === 'pinecone' }" :transform="flags.pinecone_down ? 'translate(0 250)' : ''">
          <ellipse cx="628" cy="286" rx="17" ry="24" fill="#C98B4E" />
          <path d="M628 266 l12 8 -12 8 -12 -8 z" fill="#B4763C" />
          <path d="M612 284 q16 10 32 0" fill="none" stroke="#A96A2C" stroke-width="3" />
          <path d="M611 298 q17 10 34 0" fill="none" stroke="#A96A2C" stroke-width="3" />
          <rect x="626" y="256" width="4" height="10" rx="2" fill="#7FBC84" />
        </g>
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小松鼠"
        @click="tap('squirrel')"
        @keydown.enter.prevent="tap('squirrel')"
      >
        <FriendArt
          kind="squirrel"
          :x="560"
          :y="flags.pinecone_down ? 434 : 452"
          :scale="0.9"
          :happy="!!flags.pinecone_down || fx === 'squirrel'"
        />
      </g>

      <BusArt
        :x="230"
        :y="392"
        :scale="0.8"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="树枝"
        @click="tap('branch')"
        @keydown.enter.prevent="tap('branch')"
      >
        <path d="M600 300 q40 -26 84 -6" fill="none" stroke="#A9835F" stroke-width="12" stroke-linecap="round" />
      </g>

      <FlowerArt :x="880" :y="510" :scale="0.8" color="#F6BCC4" />
      <FriendArt kind="bird" :x="830" :y="222" :scale="0.72" />
    </g>

    <!-- ============ 海边 1：海浪来啦 ============ -->
    <g v-else-if="art === 'beach-1'">
      <BusArt
        :x="240"
        :y="404"
        :scale="0.82"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="海浪"
        @click="tap('wave')"
        @keydown.enter.prevent="tap('wave')"
      >
        <rect x="560" y="404" width="380" height="80" rx="18" fill="#8FC7E8" opacity="0.5" />
        <path
          :class="{ 'is-crashing': fx === 'wave' }"
          d="M560 448 q40 -30 96 0 t96 0 t96 0 t96 0"
          fill="none"
          stroke="#FFFDF7"
          stroke-width="9"
          stroke-linecap="round"
        />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小螃蟹"
        @click="tap('crab')"
        @keydown.enter.prevent="tap('crab')"
      >
        <FriendArt kind="crab" :x="520" :y="500" :scale="0.82" :happy="fx === 'crab'" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小贝壳"
        @click="tap('shell')"
        @keydown.enter.prevent="tap('shell')"
      >
        <g :class="{ 'is-glimmer': fx === 'shell' }">
          <FriendArt kind="shell" :x="686" :y="516" :scale="0.72" />
        </g>
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小桶"
        @click="tap('bucket')"
        @keydown.enter.prevent="tap('bucket')"
      >
        <path d="M800 496 h84 l-12 66 h-60 z" fill="#EF8B7B" stroke="#D9675D" stroke-width="4" />
        <path d="M796 496 h92" stroke="#D9675D" stroke-width="6" stroke-linecap="round" />
        <path d="M812 490 q30 -26 60 0" fill="none" stroke="#D9675D" stroke-width="5" stroke-linecap="round" />
      </g>

      <FlowerArt :x="86" :y="556" :scale="0.62" color="#F7C64B" />
      <FriendArt kind="shell" :x="400" :y="548" :scale="0.55" />
    </g>

    <!-- ============ 海边 2：小海龟找妈妈 ============ -->
    <g v-else-if="art === 'beach-2'">
      <BusArt
        :x="170"
        :y="410"
        :scale="0.7"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小海龟"
        @click="tap('turtle')"
        @keydown.enter.prevent="tap('turtle')"
      >
        <FriendArt kind="turtle" :x="360" :y="486" :scale="0.82" :happy="fx === 'turtle'" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="大海方向"
        @click="tap('sea-way')"
        @keydown.enter.prevent="tap('sea-way')"
      >
        <!-- 指向大海的箭头：孩子顺着箭头方向找到妈妈 -->
        <rect x="520" y="330" width="260" height="130" fill="transparent" />
        <path d="M556 412 q64 -34 132 -6" fill="none" stroke="#FFFDF7" stroke-width="10" stroke-linecap="round" opacity="0.95" />
        <path d="M666 386 l34 22 -38 16 z" fill="#FFFDF7" opacity="0.95" />
        <text x="588" y="356" font-size="30" text-anchor="middle" fill="#FFFDF7" opacity="0.95">海</text>
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="石头方向"
        @click="tap('rock-way')"
        @keydown.enter.prevent="tap('rock-way')"
      >
        <ellipse cx="640" cy="524" rx="52" ry="26" fill="#B9AE9B" />
        <ellipse cx="626" cy="514" rx="26" ry="13" fill="#CFC5B2" />
      </g>

      <!-- 海草 -->
      <g :class="{ 'is-swishing': fx === 'seaweed' }">
        <path d="M470 540 q-12 -40 6 -70 q18 34 12 70" fill="#7FBC84" />
        <path d="M500 540 q14 -34 -2 -58 q-16 28 -8 58" fill="#8CC98A" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="海草"
        @click="tap('seaweed')"
        @keydown.enter.prevent="tap('seaweed')"
      >
        <rect x="452" y="466" width="72" height="80" fill="transparent" />
      </g>

      <!-- 妈妈海龟 -->
      <g v-if="flags.turtle_mom" class="mom-reveal">
        <FriendArt kind="turtle" :x="852" :y="452" :scale="1.15" happy />
      </g>
      <g v-else class="mom-hidden" pointer-events="none">
        <ellipse cx="852" cy="486" rx="60" ry="26" fill="#7BBEDF" opacity="0.55" />
      </g>

      <FriendArt kind="shell" :x="760" :y="548" :scale="0.6" />
    </g>

    <!-- ============ 海边 3：贝壳小桶 ============ -->
    <g v-else-if="art === 'beach-3'">
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小桶"
        @click="tap('bucket')"
        @keydown.enter.prevent="tap('bucket')"
      >
        <path d="M700 424 h120 l-16 96 h-88 z" fill="#EF8B7B" stroke="#D9675D" stroke-width="5" />
        <path d="M694 424 h132" stroke="#D9675D" stroke-width="8" stroke-linecap="round" />
        <path d="M716 418 q44 -34 88 0" fill="none" stroke="#D9675D" stroke-width="6" stroke-linecap="round" />
        <g v-if="flags.shell_a">
          <FriendArt kind="shell" :x="726" :y="470" :scale="0.42" />
        </g>
        <g v-if="flags.shell_b">
          <FriendArt kind="shell" :x="760" :y="486" :scale="0.38" />
        </g>
        <g v-if="flags.shell_c">
          <FriendArt kind="shell" :x="796" :y="468" :scale="0.4" />
        </g>
      </g>

      <!-- 贝壳本身很小，外面套一圈透明热区，手指点得中（推荐触控尺寸 ≥44px） -->
      <g v-if="!flags.shell_a" class="tap shell-float" role="button" tabindex="0" aria-label="贝壳一" @click="tap('shell-a')" @keydown.enter.prevent="tap('shell-a')">
        <rect x="332" y="464" width="96" height="96" fill="transparent" />
        <FriendArt kind="shell" :x="380" :y="512" :scale="0.72" :happy="fx === 'shell-a'" />
      </g>
      <g v-if="!flags.shell_b" class="tap shell-float" role="button" tabindex="0" aria-label="贝壳二" @click="tap('shell-b')" @keydown.enter.prevent="tap('shell-b')">
        <rect x="422" y="498" width="96" height="96" fill="transparent" />
        <FriendArt kind="shell" :x="470" :y="546" :scale="0.62" :happy="fx === 'shell-b'" />
      </g>
      <g v-if="!flags.shell_c" class="tap shell-float" role="button" tabindex="0" aria-label="贝壳三" @click="tap('shell-c')" @keydown.enter.prevent="tap('shell-c')">
        <rect x="242" y="510" width="96" height="96" fill="transparent" />
        <FriendArt kind="shell" :x="290" :y="558" :scale="0.58" :happy="fx === 'shell-c'" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小海龟"
        @click="tap('turtle')"
        @keydown.enter.prevent="tap('turtle')"
      >
        <FriendArt kind="turtle" :x="560" :y="470" :scale="0.8" :happy="fx === 'turtle'" />
      </g>

      <BusArt
        :x="150"
        :y="410"
        :scale="0.66"
        :eyes="fx === 'bus' ? 'happy' : 'open'"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
    </g>

    <!-- ============ 公园汇合 ============ -->
    <g v-else-if="art === 'park'">
      <TreeArt :x="96" :y="440" :scale="1" />
      <TreeArt :x="926" :y="436" :scale="0.9" :delay="1.1" />
      <BusArt
        :x="180"
        :y="382"
        :scale="0.78"
        eyes="happy"
        :door-open="true"
        :light-on="true"
        :vehicle="vehicle"
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
        <circle cx="516" cy="498" r="11" fill="#F7C64B" />
        <circle cx="546" cy="506" r="9" fill="#E3695F" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小兔子"
        @click="tap('rabbit')"
        @keydown.enter.prevent="tap('rabbit')"
      >
        <FriendArt kind="rabbit" :x="360" :y="406" :scale="0.94" :happy="fx === 'rabbit'" />
      </g>

      <g v-if="flags.route === 'forest'" class="tap" role="button" tabindex="0" aria-label="小松鼠" @click="tap('squirrel')" @keydown.enter.prevent="tap('squirrel')">
        <FriendArt kind="squirrel" :x="470" :y="418" :scale="0.8" :happy="fx === 'squirrel'" />
      </g>
      <g v-else class="tap" role="button" tabindex="0" aria-label="小海龟" @click="tap('turtle')" @keydown.enter.prevent="tap('turtle')">
        <FriendArt kind="turtle" :x="470" :y="418" :scale="0.78" :happy="fx === 'turtle'" />
      </g>

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸭子"
        @click="tap('duck')"
        @keydown.enter.prevent="tap('duck')"
      >
        <FriendArt kind="duck" :x="762" :y="412" :scale="0.92" :happy="fx === 'duck'" />
      </g>

      <g class="balloons">
        <line x1="840" y1="300" x2="840" y2="380" stroke="#C99B77" stroke-width="2.5" />
        <circle cx="840" cy="272" r="22" fill="#B9A6D9" />
        <line x1="878" y1="326" x2="878" y2="392" stroke="#C99B77" stroke-width="2.5" />
        <circle cx="878" cy="300" r="18" fill="#F7C64B" />
      </g>
      <FlowerArt :x="300" :y="512" :scale="0.8" color="#F6BCC4" />
      <FlowerArt :x="830" :y="518" :scale="0.85" color="#EF8B7B" />
    </g>

    <!-- ============ 结局 A：一起野餐 ============ -->
    <g v-else-if="art === 'picnic'">
      <TreeArt :x="110" :y="438" :scale="0.86" />
      <TreeArt :x="910" :y="444" :scale="0.8" :delay="1.3" />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="水果篮"
        @click="tap('basket')"
        @keydown.enter.prevent="tap('basket')"
      >
        <path d="M420 452 L640 452 L620 528 L440 528 Z" fill="#E7A96B" stroke="#C98B4E" stroke-width="4" />
        <path d="M470 452 q60 -54 120 0" fill="none" stroke="#C98B4E" stroke-width="6" stroke-linecap="round" />
        <circle cx="480" cy="472" r="14" fill="#E3695F" />
        <circle cx="530" cy="466" r="13" fill="#F7C64B" />
        <circle cx="576" cy="474" r="12" fill="#8CC98A" />
      </g>

      <path d="M300 500 L700 500 L740 572 L260 572 Z" fill="#FFFDF7" />
      <path d="M300 500 L700 500 L706 516 L294 516 Z" fill="#F6BCC4" opacity="0.85" />
      <path d="M272 546 L728 546 L734 560 L266 560 Z" fill="#F6BCC4" opacity="0.55" />
      <path d="M360 516 L334 572 M440 516 L430 572 M520 516 L526 572 M600 516 L614 572" stroke="#F6BCC4" stroke-width="9" opacity="0.45" />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小兔子"
        @click="tap('rabbit')"
        @keydown.enter.prevent="tap('rabbit')"
      >
        <FriendArt kind="rabbit" :x="330" :y="430" :scale="0.9" :happy="fx === 'rabbit'" />
        <circle v-if="fx === 'rabbit'" cx="352" cy="410" r="9" fill="#E3695F" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小松鼠"
        @click="tap('squirrel')"
        @keydown.enter.prevent="tap('squirrel')"
      >
        <FriendArt kind="squirrel" :x="480" :y="436" :scale="0.78" :happy="fx === 'squirrel'" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸭子"
        @click="tap('duck')"
        @keydown.enter.prevent="tap('duck')"
      >
        <FriendArt kind="duck" :x="664" :y="432" :scale="0.86" :happy="fx === 'duck'" />
      </g>

      <BusArt
        :x="860"
        :y="392"
        :scale="0.6"
        eyes="happy"
        :light-on="true"
        :vehicle="vehicle"
        @part="onBusPart"
      />
      <FlowerArt :x="200" :y="540" :scale="0.85" color="#F7C64B" />
    </g>

    <!-- ============ 结局 B：音乐派对 ============ -->
    <g v-else-if="art === 'dance'">
      <TreeArt :x="120" :y="452" :scale="0.7" />
      <TreeArt :x="892" :y="456" :scale="0.66" :delay="1.2" />

      <g class="notes notes--party">
        <text x="240" y="270" font-size="34" fill="#EF8B7B">♪</text>
        <text x="330" y="222" font-size="26" fill="#F7C64B">♫</text>
        <text x="700" y="246" font-size="30" fill="#B9A6D9">♪</text>
        <text x="780" y="286" font-size="24" fill="#7FBC84">♬</text>
      </g>

      <path d="M250 470 Q500 436 760 470" fill="none" stroke="#F6BCC4" stroke-width="10" stroke-dasharray="22 16" stroke-linecap="round" opacity="0.7" />

      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小兔子跳舞"
        @click="tap('rabbit')"
        @keydown.enter.prevent="tap('rabbit')"
      >
        <FriendArt kind="rabbit" :x="300" :y="416" :scale="0.95" :happy="fx === 'rabbit'" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小松鼠转圈"
        @click="tap('squirrel')"
        @keydown.enter.prevent="tap('squirrel')"
      >
        <FriendArt kind="squirrel" :x="430" :y="428" :scale="0.82" :happy="fx === 'squirrel'" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸭子唱歌"
        @click="tap('duck')"
        @keydown.enter.prevent="tap('duck')"
      >
        <FriendArt kind="duck" :x="560" :y="420" :scale="0.9" :happy="fx === 'duck'" />
      </g>
      <g
        class="tap"
        role="button"
        tabindex="0"
        aria-label="小鸟唱歌"
        @click="tap('bird')"
        @keydown.enter.prevent="tap('bird')"
      >
        <FriendArt kind="bird" :x="690" :y="300" :scale="0.95" :happy="fx === 'bird'" />
      </g>

      <BusArt
        :x="790"
        :y="402"
        :scale="0.72"
        eyes="happy"
        :light-on="true"
        :vehicle="vehicle"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
      <FlowerArt :x="200" :y="540" :scale="0.8" color="#F6BCC4" />
    </g>

    <!-- ============ 晚安 ============ -->
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
        :vehicle="vehicle"
        :friends="{ rabbit: false, bear: false, duck: false }"
        :fx="fx === 'bus' ? 'bounce' : ''"
        @part="onBusPart"
      />
      <FriendArt :kind="flags.route === 'beach' ? 'turtle' : 'squirrel'" :x="700" :y="428" :scale="0.78" happy />
      <FriendArt kind="rabbit" :x="788" :y="428" :scale="0.78" happy />
      <FriendArt kind="duck" :x="866" :y="436" :scale="0.74" happy />
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
  art: { type: String, default: 'wake-up' },
  flags: { type: Object, default: () => ({}) },
  light: { type: String, default: '' },
  fx: { type: String, default: '' },
  vehicle: { type: String, default: 'bus' },
  viewBox: { type: String, default: '0 0 1000 620' },
})

const emit = defineEmits(['interact'])

const uid = `scene-${Math.random().toString(36).slice(2, 8)}`
const skyId = `${uid}-sky`
const roadId = `${uid}-road`
const seaId = `${uid}-sea`
const sandId = `${uid}-sand`

const SKIES = {
  cover: ['#FFE9C9', '#FFD8B4'],
  'wake-up': ['#FFF0D6', '#FFE0BE'],
  fork: ['#DFF3FA', '#F1F9E4'],
  'forest-1': ['#E3F2DC', '#F4FBE7'],
  'forest-2': ['#E4F0E2', '#F6FBE9'],
  'forest-3': ['#E6F2DF', '#F7FBE8'],
  'beach-1': ['#D8EEF9', '#FFF3D6'],
  'beach-2': ['#D8EEF9', '#FFF1CE'],
  'beach-3': ['#DCEFF9', '#FFF5DC'],
  park: ['#D9F0FA', '#EDF9DC'],
  picnic: ['#DCF1FA', '#F4FBE4'],
  dance: ['#FFF2E4', '#FFF0D2'],
  goodnight: ['#6E6696', '#F3B49B'],
}

const sky = computed(() => SKIES[props.art] || SKIES['wake-up'])
const isNight = computed(() => props.art === 'goodnight')
const isBeach = computed(() => props.art.startsWith('beach'))

const hills = computed(() =>
  isNight.value
    ? { back: '#6E7F86', front: '#5A7263', grass: '#4F6B57' }
    : { back: '#C4E2B4', front: '#A8D39A', grass: '#8CC98A' },
)

const hillBack = 'M0 440 Q150 360 330 420 T660 410 T1000 430 L1000 620 L0 620 Z'
const hillFront = 'M0 486 Q220 436 470 484 T1000 470 L1000 620 L0 620 Z'

const hasRoad = computed(() => ['cover', 'wake-up', 'fork'].includes(props.art))

const sunPositions = {
  cover: { x: 168, y: 120, scale: 0.95 },
  'wake-up': { x: 150, y: 108, scale: 1 },
  fork: { x: 108, y: 96, scale: 0.82 },
  'forest-1': { x: 120, y: 96, scale: 0.7 },
  'forest-2': { x: 96, y: 104, scale: 0.66 },
  'forest-3': { x: 128, y: 92, scale: 0.7 },
  'beach-1': { x: 132, y: 96, scale: 0.95 },
  'beach-2': { x: 110, y: 100, scale: 0.8 },
  'beach-3': { x: 146, y: 94, scale: 0.86 },
  park: { x: 862, y: 96, scale: 0.88 },
  picnic: { x: 150, y: 100, scale: 0.9 },
  dance: { x: 880, y: 98, scale: 0.9 },
  goodnight: { x: 820, y: 286, scale: 0.78 },
}

const sunPos = computed(() => sunPositions[props.art] || sunPositions['wake-up'])
const sunTappable = computed(() =>
  ['wake-up', 'picnic', 'dance', 'goodnight', 'beach-1', 'beach-3'].includes(props.art),
)

const clouds = computed(() => {
  if (props.art === 'goodnight') {
    return [
      { x: 220, y: 130, scale: 0.8, opacity: 0.22 },
      { x: 760, y: 150, scale: 0.7, opacity: 0.18 },
    ]
  }
  if (isBeach.value) {
    return [
      { x: 300, y: 108, scale: 0.95, opacity: 0.95 },
      { x: 700, y: 78, scale: 0.8, opacity: 0.9 },
      { x: 900, y: 168, scale: 0.62, opacity: 0.8 },
    ]
  }
  return [
    { x: 330, y: 118, scale: 0.82, opacity: 0.92 },
    { x: 800, y: 156, scale: 0.68, opacity: 0.85 },
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

const ariaLabels = {
  cover: '小巴士嘟嘟和好朋友们',
  'wake-up': '早上好，小巴士嘟嘟在家门口醒来了',
  fork: '前面有两条路，一条通向森林，一条通向大海',
  'forest-1': '森林里，小鸟在树上唱歌',
  'forest-2': '小兔子找不到家，嘟嘟来帮忙',
  'forest-3': '小松鼠够不到树上的松果',
  'beach-1': '海边，海浪拍打着沙滩',
  'beach-2': '小海龟想找妈妈',
  'beach-3': '沙滩上的贝壳要放回小桶里',
  park: '大家来到公园野餐',
  picnic: '大家在野餐，一起分享水果',
  dance: '大家唱歌跳舞，好开心',
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

.notes text,
.notes--party text {
  animation: note-float 3s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.notes text:nth-child(2) {
  animation-delay: 0.8s;
}

.notes--party text:nth-child(3) {
  animation-delay: 1.1s;
}

.notes--party text:nth-child(4) {
  animation-delay: 1.7s;
}

.is-wobbling {
  animation: mush-wobble 0.8s ease-in-out;
  transform-box: fill-box;
  transform-origin: center bottom;
}

.is-shaking {
  animation: cone-shake 0.9s ease-in-out;
  transform-box: fill-box;
  transform-origin: center top;
}

.is-crashing {
  animation: wave-crash 1s ease-out;
}

.is-glimmer {
  animation: shell-glimmer 1.1s ease-in-out;
}

.is-swishing {
  animation: seaweed-sway 1.6s ease-in-out;
  transform-box: fill-box;
  transform-origin: center bottom;
}

.home-reveal,
.mom-reveal {
  animation: pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-box: fill-box;
  transform-origin: center bottom;
}

.shell-float {
  animation: shell-bob 3.4s ease-in-out infinite;
}

.waves path {
  animation: wave-drift 6s ease-in-out infinite;
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

@keyframes note-float {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.75;
  }
  50% {
    transform: translateY(-14px);
    opacity: 1;
  }
}

@keyframes mush-wobble {
  0%,
  100% {
    transform: rotate(0deg);
  }
  30% {
    transform: rotate(-9deg);
  }
  65% {
    transform: rotate(7deg);
  }
}

@keyframes cone-shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-8deg);
  }
  60% {
    transform: rotate(6deg);
  }
  85% {
    transform: rotate(-3deg);
  }
}

@keyframes wave-crash {
  0% {
    transform: translateX(0);
  }
  40% {
    transform: translateX(-26px) translateY(-8px);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes shell-glimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
    filter: drop-shadow(0 0 14px rgba(255, 240, 200, 0.95));
  }
}

@keyframes seaweed-sway {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(7deg);
  }
}

@keyframes pop-in {
  from {
    transform: scale(0.6) translateY(16px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes shell-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes wave-drift {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-14px);
  }
}
</style>
