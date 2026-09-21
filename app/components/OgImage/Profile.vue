<template>
  <div :style="root">
    <div :style="stripes"></div>
    <svg
      v-for="star in stars"
      :key="star.left"
      viewBox="-6 -4 112 108"
      :width="star.size"
      :height="star.size"
      :style="{ position: 'absolute', left: `${star.left}px`, top: `${star.top}px`, transform: `rotate(${star.rotate}deg)` }"
    >
      <path
        :d="STAR_PATH"
        fill="#ffa2a2"
        stroke="#fb2c36"
        stroke-width="7"
        stroke-linejoin="round"
      />
    </svg>
    <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }">
      <img
        :src="avatar"
        alt=""
        width="200"
        height="200"
        :style="{ borderRadius: '9999px', border: '10px solid #0a0e12' }"
      />
      <div :style="{ display: 'flex', marginTop: '20px', color: '#ffffff', fontSize: '104px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }">
        {{ title }}
      </div>
      <div :style="{ display: 'flex', justifyContent: 'center', marginTop: '18px', maxWidth: '760px', color: '#9ca3ac', fontSize: '32px', lineHeight: 1.3, textAlign: 'center' }">
        {{ description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { STAR_PATH } from '~/utils/shapes'

const {
  title = 'RedStar',
  description = 'Discord bots and open-source tooling for the web.',
  avatar = 'https://avatars.githubusercontent.com/u/76824516?v=4&s=400'
} = defineProps<{
  title?: string
  description?: string
  avatar?: string
}>()

// Satori only understands inline styles and flexbox, so this card avoids utility classes.
const root: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  width: '100%',
  height: '100%',
  padding: '56px 72px',
  backgroundColor: '#0a0e12',
  fontFamily: 'Google Sans Flex'
}

const stripes: CSSProperties = {
  position: 'absolute',
  top: '0px',
  left: '0px',
  width: '1200px',
  height: '230px',
  backgroundImage: 'repeating-linear-gradient(-18deg, #fb2c36 0px, #fb2c36 56px, transparent 56px, transparent 112px)'
}

const stars = [
  { left: 1020, top: 300, size: 64, rotate: 12 },
  { left: 1110, top: 420, size: 34, rotate: -8 },
  { left: 110, top: 330, size: 44, rotate: -14 },
  { left: 60, top: 450, size: 26, rotate: 20 }
]
</script>
