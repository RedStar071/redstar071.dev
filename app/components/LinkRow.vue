<template>
  <li>
    <ULink
      :to
      :target="isHttp ? '_blank' : undefined"
      raw
      class="group/row flex min-h-16 items-center gap-3.5 rounded-xs bg-elevated px-4 py-3 transition-[background-color,border-radius] duration-300 ease-(--ease-effects) hover:rounded-md hover:bg-accented focus-visible:rounded-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
    >
      <slot name="leading">
        <UIcon
          v-if="icon"
          :name="icon"
          class="size-6 shrink-0 text-highlighted"
        />
      </slot>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-medium text-highlighted">{{ title }}</span>
        <span
          v-if="description"
          class="block truncate text-sm text-muted"
        >{{ description }}</span>
      </span>
      <slot name="trailing"></slot>
      <UIcon
        :name="external ? 'i-material-symbols-arrow-outward-rounded' : 'i-material-symbols-chevron-right-rounded'"
        class="size-5 shrink-0 text-muted transition-[translate,color] duration-300 ease-(--ease-spatial) group-hover/row:text-highlighted"
        :class="external ? 'group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5' : 'group-hover/row:translate-x-1'"
      />
      <span
        v-if="isHttp"
        class="sr-only"
      >(opens in a new tab)</span>
    </ULink>
  </li>
</template>

<script setup lang="ts">
const { to } = defineProps<{
  to: string;
  title: string;
  description?: string;
  icon?: string;
}>();

const isHttp = computed(() => /^https?:/.test(to));
const external = computed(() => isHttp.value || to.startsWith("mailto:"));
</script>
