<template>
  <span
    class="relative inline-grid shrink-0 place-items-center"
    :class="sizes[size]"
  >
    <span
      aria-hidden="true"
      class="absolute inset-0 transition-transform duration-700 ease-(--ease-spatial)"
      :class="[shapeClasses[shape], turns[shape], tones[tone]]"
    ></span>
    <UIcon
      :name="icon"
      class="relative"
      :class="[iconSizes[size], iconTones[tone]]"
    />
  </span>
</template>

<script setup lang="ts">
import type { Shape } from "~/utils/shapes";

const { shape = "cookie", tone = "tonal", size = "md" } = defineProps<{
  icon: string;
  shape?: Shape;
  tone?: "solid" | "tonal" | "neutral";
  size?: "sm" | "md" | "lg";
}>();

// Half a turn of each shape's symmetry, so the hover spin lands on an identical silhouette.
const turns: Record<Shape, string> = {
  cookie: "group-hover:rotate-[20deg]",
  burst: "group-hover:rotate-[15deg]",
  flower: "group-hover:rotate-[22.5deg]",
  clover: "group-hover:rotate-45",
  sunny: "group-hover:rotate-[22.5deg]",
  star: "group-hover:rotate-[36deg]"
};

const tones = {
  solid: "bg-primary dark:bg-primary-500",
  tonal: "bg-primary-100 dark:bg-primary-950",
  neutral: "bg-elevated"
};

const iconTones = {
  solid: "text-inverted",
  tonal: "text-primary-700 dark:text-primary-300",
  neutral: "text-highlighted"
};

const sizes = {
  sm: "size-8",
  md: "size-11",
  lg: "size-14"
};

const iconSizes = {
  sm: "size-4",
  md: "size-6",
  lg: "size-7"
};
</script>
