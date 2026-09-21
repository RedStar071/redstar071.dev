<template>
  <div class="flex min-h-dvh flex-col">
    <button
      type="button"
      class="sr-only rounded-full bg-primary px-4 py-2 font-medium text-inverted focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      @click="skipToContent"
    >
      skip to content
    </button>
    <AppHeader />
    <main
      id="main"
      ref="main"
      tabindex="-1"
      class="flex-1 outline-none"
    >
      <slot></slot>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const main = useTemplateRef("main");

function skipToContent() {
  main.value?.focus();
  main.value?.scrollIntoView();
}
</script>
