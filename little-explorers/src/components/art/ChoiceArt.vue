<template>
  <svg class="choice-art" viewBox="0 0 200 130" role="img" :aria-label="label">
    <!-- 公交巴士 -->
    <g v-if="art === 'bus'">
      <ellipse cx="100" cy="112" rx="66" ry="8" fill="#5f9e70" opacity="0.14" />
      <rect x="34" y="42" width="132" height="58" rx="18" fill="#F5C24B" stroke="#E0A93B" stroke-width="3" />
      <rect x="34" y="58" width="132" height="10" rx="5" fill="#FFF7E6" opacity="0.85" />
      <rect x="48" y="52" width="26" height="22" rx="7" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="3" />
      <rect x="82" y="52" width="26" height="22" rx="7" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="3" />
      <rect x="116" y="52" width="26" height="22" rx="7" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="3" />
      <rect x="140" y="80" width="20" height="20" rx="7" fill="#FFE3A6" stroke="#FFF7E6" stroke-width="2" />
      <circle cx="150" cy="72" r="4" fill="#584A42" />
      <path d="M144 78 q6 5 12 0" fill="none" stroke="#584A42" stroke-width="2.6" stroke-linecap="round" />
      <circle cx="66" cy="104" r="13" fill="#4A4038" />
      <circle cx="66" cy="104" r="7" fill="#FFF7E6" />
      <circle cx="132" cy="104" r="13" fill="#4A4038" />
      <circle cx="132" cy="104" r="7" fill="#FFF7E6" />
    </g>

    <!-- 消防车 -->
    <g v-else-if="art === 'firetruck'">
      <ellipse cx="100" cy="114" rx="70" ry="8" fill="#5f9e70" opacity="0.14" />
      <g class="ladder">
        <rect x="40" y="26" width="120" height="7" rx="3.5" fill="#E4E8EF" />
        <g stroke="#C3C9D4" stroke-width="3">
          <line x1="58" y1="26" x2="58" y2="33" />
          <line x1="82" y1="26" x2="82" y2="33" />
          <line x1="106" y1="26" x2="106" y2="33" />
          <line x1="130" y1="26" x2="130" y2="33" />
        </g>
        <rect x="40" y="33" width="120" height="5" rx="2.5" fill="#D5DAE3" />
      </g>
      <rect x="34" y="44" width="132" height="58" rx="18" fill="#E96A5C" stroke="#C24A3D" stroke-width="3" />
      <rect x="34" y="74" width="132" height="12" rx="6" fill="#FFF7E6" opacity="0.9" />
      <circle cx="72" cy="40" r="5" fill="#E8564A" />
      <circle cx="86" cy="40" r="5" fill="#6FAED4" />
      <rect x="48" y="52" width="30" height="20" rx="7" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="3" />
      <rect x="88" y="52" width="30" height="20" rx="7" fill="#A6D8E9" stroke="#FFF7E6" stroke-width="3" />
      <circle cx="152" cy="70" r="4" fill="#584A42" />
      <path d="M146 76 q6 5 12 0" fill="none" stroke="#584A42" stroke-width="2.6" stroke-linecap="round" />
      <circle cx="66" cy="104" r="13" fill="#4A4038" />
      <circle cx="66" cy="104" r="7" fill="#FFF7E6" />
      <circle cx="134" cy="104" r="13" fill="#4A4038" />
      <circle cx="134" cy="104" r="7" fill="#FFF7E6" />
    </g>

    <!-- 森林 -->
    <g v-else-if="art === 'forest'">
      <path d="M0 118 Q100 96 200 116 L200 130 L0 130 Z" fill="#8CC98A" />
      <ellipse cx="100" cy="118" rx="46" ry="9" fill="#7FBC84" opacity="0.5" />
      <g>
        <rect x="94" y="72" width="12" height="44" rx="5" fill="#A9835F" />
        <circle cx="100" cy="56" r="30" fill="#7FBC84" />
        <circle cx="74" cy="70" r="20" fill="#8CC98A" />
        <circle cx="126" cy="70" r="20" fill="#8CC98A" />
        <circle cx="100" cy="40" r="17" fill="#9BD398" />
      </g>
      <g>
        <rect x="42" y="88" width="8" height="30" rx="4" fill="#A9835F" />
        <circle cx="46" cy="80" r="20" fill="#8CC98A" />
        <circle cx="46" cy="68" r="13" fill="#9BD398" />
      </g>
      <g>
        <rect x="152" y="92" width="7" height="26" rx="3.5" fill="#A9835F" />
        <circle cx="155" cy="84" r="17" fill="#8CC98A" />
      </g>
      <circle cx="120" cy="34" r="4" fill="#F0A24E" />
      <path d="M124 34 l7 2 -7 2 z" fill="#F0A24E" />
    </g>

    <!-- 海边 -->
    <g v-else-if="art === 'beach'">
      <rect x="0" y="66" width="200" height="34" fill="#8FC7E8" />
      <path d="M0 84 q22 -9 44 0 t44 0 t44 0 t44 0 t44 0" fill="none" stroke="#FFFDF7" stroke-width="4" stroke-linecap="round" opacity="0.8" />
      <path d="M0 96 Q60 80 120 96 T200 90 L200 130 L0 130 Z" fill="#F7E3BE" />
      <circle cx="44" cy="46" r="16" fill="#F7C64B" />
      <g>
        <path d="M150 108 q-4 -26 14 -34 q2 20 -6 34 z" fill="#E3695F" />
        <path d="M150 108 q-16 -14 -10 -30 q12 10 12 30 z" fill="#F08A72" />
      </g>
      <ellipse cx="86" cy="112" rx="12" ry="6" fill="#FFD9C2" stroke="#F0A88F" stroke-width="2" />
    </g>

    <!-- 野餐 -->
    <g v-else-if="art === 'picnic'">
      <path d="M40 92 L160 92 L172 122 L28 122 Z" fill="#FFFDF7" />
      <path d="M40 92 L160 92 L163 99 L37 99 Z" fill="#F6BCC4" opacity="0.9" />
      <path d="M34 110 L166 110 L168 116 L32 116 Z" fill="#F6BCC4" opacity="0.6" />
      <g>
        <path d="M74 74 q0 -26 16 -26 q16 0 16 26 z" fill="#E3695F" />
        <rect x="87" y="46" width="6" height="10" rx="3" fill="#7FBC84" />
        <ellipse cx="90" cy="40" rx="10" ry="5" fill="#7FBC84" />
      </g>
      <path d="M118 84 q10 -22 24 -6 q10 12 -4 18 z" fill="#F7C64B" />
      <circle cx="56" cy="84" r="10" fill="#8CC98A" />
      <circle cx="56" cy="84" r="5" fill="#A8D39A" />
      <rect x="140" y="78" width="26" height="18" rx="5" fill="#C99B77" />
      <path d="M140 84 q13 -10 26 0" fill="none" stroke="#A9835F" stroke-width="2.5" />
    </g>

    <!-- 唱歌跳舞 -->
    <g v-else-if="art === 'dance'">
      <path d="M0 118 Q100 104 200 118 L200 130 L0 130 Z" fill="#8CC98A" />
      <text x="42" y="58" font-size="30" fill="#EF8B7B">♪</text>
      <text x="146" y="46" font-size="26" fill="#F7C64B">♫</text>
      <text x="112" y="34" font-size="20" fill="#B9A6D9">♬</text>
      <g>
        <ellipse cx="100" cy="106" rx="17" ry="20" fill="#FFF3E6" />
        <circle cx="100" cy="76" r="14" fill="#FFF3E6" />
        <ellipse cx="93" cy="54" rx="4.5" ry="14" fill="#FFF3E6" />
        <ellipse cx="107" cy="54" rx="4.5" ry="14" fill="#FFF3E6" />
        <circle cx="95" cy="76" r="2" fill="#584A42" />
        <circle cx="105" cy="76" r="2" fill="#584A42" />
        <path d="M96 82 q4 4 8 0" fill="none" stroke="#584A42" stroke-width="1.8" stroke-linecap="round" />
        <ellipse cx="78" cy="98" rx="5" ry="11" fill="#FFF3E6" transform="rotate(28 78 98)" />
        <ellipse cx="122" cy="98" rx="5" ry="11" fill="#FFF3E6" transform="rotate(-28 122 98)" />
      </g>
    </g>
  </svg>
</template>

<script setup>
defineProps({
  art: { type: String, default: 'bus' },
  label: { type: String, default: '' },
})
</script>

<style scoped>
.choice-art {
  display: block;
  width: 100%;
  height: auto;
}

.ladder {
  animation: ladder-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-box: fill-box;
  transform-origin: center bottom;
}

@keyframes ladder-in {
  from {
    transform: scaleY(0.3);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
