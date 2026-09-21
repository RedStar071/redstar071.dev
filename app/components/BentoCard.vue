<template>
  <section
    :aria-labelledby="headingId"
    class="group flex flex-col rounded-2xl bg-muted p-5 motion-safe:animate-rise sm:p-6"
  >
    <ShapeBadge
      :icon
      :shape
      :tone
    />
    <h2
      :id="headingId"
      class="mt-4 text-[1.75rem] leading-tight font-medium tracking-tight text-balance text-highlighted sm:text-[2rem]"
    >
      {{ title }}
    </h2>
    <div class="mt-5 flex-1">
      <slot></slot>
    </div>
    <div
      v-if="$slots.actions"
      class="mt-5 flex flex-wrap justify-end gap-2"
    >
      <slot name="actions"></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Shape } from '~/utils/shapes'

const { shape = 'cookie', tone = 'tonal' } = defineProps<{
  title: string
  icon: string
  shape?: Shape
  tone?: 'solid' | 'tonal'
}>()

const headingId = useId()
</script>
