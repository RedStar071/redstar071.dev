<template>
  <ClientOnly>
    <UButton
      :aria-label="`Switch to ${nextTheme} mode`"
      :icon="nextTheme === 'dark' ? 'i-material-symbols-dark-mode-outline-rounded' : 'material-symbols:light-mode-outline-rounded'"
      color="neutral"
      variant="ghost"
      @click="startViewTransition"
    />
    <template #fallback>
      <div class="size-9"></div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const reducedMotion = usePreferredReducedMotion();

const nextTheme = computed(() => (colorMode.value === "dark" ? "light" : "dark"));

function switchTheme() {
  colorMode.preference = nextTheme.value;
}

function startViewTransition(event: MouseEvent) {
  if (!document.startViewTransition || reducedMotion.value === "reduce") {
    switchTheme();
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(() => {
    switchTheme();
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 600,
        easing: "cubic-bezier(.76,.32,.29,.99)",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  });
}
</script>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-new(root) {
  z-index: 9999;
}

::view-transition-old(root) {
  z-index: 1;
}
</style>
