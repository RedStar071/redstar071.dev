<template>
  <img
    v-if="project.logo"
    :src="project.logo"
    alt=""
    :width="size === 'lg' ? 56 : 44"
    :height="size === 'lg' ? 56 : 44"
    loading="lazy"
    class="shrink-0 rounded-md object-cover"
    :class="size === 'lg' ? 'size-14' : 'size-11'"
  />
  <ShapeBadge
    v-else
    :icon="project.icon ?? 'i-material-symbols-deployed-code-outline-rounded'"
    :size="size === 'lg' ? 'lg' : 'md'"
    shape="cookie"
  />
</template>

<script setup lang="ts">
import type { ProjectsCollectionItem } from "@nuxt/content";

const { size = "md" } = defineProps<{
  project: Pick<ProjectsCollectionItem, "logo" | "icon">;
  size?: "md" | "lg";
}>();
</script>
