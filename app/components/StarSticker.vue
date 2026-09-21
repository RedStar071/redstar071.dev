<template>
  <svg
    viewBox="-6 -4 112 108"
    aria-hidden="true"
    focusable="false"
    class="overflow-visible"
    :class="twinkle && 'motion-safe:animate-twinkle'"
  >
    <path
      :d="STAR_PATH"
      :class="variants[variant]"
      stroke-width="7"
      stroke-linejoin="round"
    />
    <path
      v-if="variant === 'sticker'"
      :d="STAR_PATH"
      fill="none"
      class="stroke-white/70"
      stroke-width="4"
      stroke-linecap="round"
      stroke-dasharray="14 400"
      stroke-dashoffset="-2"
      transform="translate(50 46) scale(0.7) translate(-50 -46)"
    />
  </svg>
</template>

<script setup lang="ts">
const { variant = "sticker", twinkle = false } = defineProps<{
  variant?: "sticker" | "solid" | "outline";
  twinkle?: boolean;
}>();

const variants = {
  sticker: "fill-primary-300 stroke-primary-500",
  solid: "fill-primary-500 stroke-primary-500",
  outline: "fill-none stroke-current"
};
</script>
