<template>
  <footer class="mt-4 pb-6">
    <UContainer>
      <div class="rounded-2xl bg-muted p-5 sm:p-8">
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="social in socials"
            :key="social.label"
          >
            <UButton
              :to="social.to"
              target="_blank"
              :icon="social.icon"
              size="lg"
              square
              :aria-label="`${social.label} (opens in a new tab)`"
            />
          </li>
        </ul>
        <USeparator class="my-6" />
        <div class="flex flex-wrap items-center justify-between gap-4">
          <ULink
            to="/"
            raw
            class="group flex items-center gap-2 text-2xl font-black tracking-tight text-highlighted font-round"
          >
            <span>{{ global.username }}<span class="text-primary">.dev</span></span>
            <StarSticker
              twinkle
              class="size-6 transition-transform duration-700 ease-(--ease-spatial) group-hover:rotate-[144deg]"
            />
          </ULink>
          <UButton
            :to="`mailto:${global.email}`"
            label="contact"
            icon="i-material-symbols-mail-outline-rounded"
            variant="soft"
          />
        </div>
      </div>
      <p class="mt-6 text-center font-mono text-xs text-muted">
        © {{ year }} {{ global.name }} · built with Nuxt UI, a lot of red and a few stars
      </p>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
const { global, socials } = useAppConfig()
const year = new Date().getFullYear()
</script>
