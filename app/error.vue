<template>
  <UApp>
    <NuxtLayout>
      <UContainer class="py-20 sm:py-28">
        <div class="relative mx-auto flex max-w-xl flex-col items-center text-center">
          <div
            aria-hidden="true"
            class="relative h-28 w-56"
          >
            <StarSticker
              twinkle
              class="absolute top-2 left-1/2 size-20 -translate-x-1/2 -rotate-12"
            />
            <StarSticker
              twinkle
              class="absolute top-12 left-4 size-8 rotate-12 [--delay:1.2s]"
            />
            <StarSticker
              twinkle
              class="absolute top-0 right-6 size-6 [--delay:2.4s]"
            />
          </div>
          <p class="mt-4 font-mono text-sm text-muted">
            {{ error.statusCode }}
          </p>
          <h1 class="mt-2 text-5xl leading-none font-black tracking-tight text-balance text-highlighted font-round sm:text-6xl">
            {{ isNotFound ? 'this page drifted off' : 'something went wrong' }}
          </h1>
          <p class="mt-5 text-lg text-pretty text-toned">
            {{ isNotFound ? 'it may have moved, or it never existed. the home page is still where i left it.' : 'the page hit an error while loading. try again in a moment, or head back home.' }}
          </p>
          <UButton
            label="back home"
            icon="i-material-symbols-home-outline-rounded"
            size="lg"
            class="mt-8"
            @click="clearError({ redirect: '/' })"
          />
        </div>
      </UContainer>
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps<{
  error: NuxtError
}>()

const isNotFound = computed(() => error.statusCode === 404)

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: isNotFound.value ? 'Page not found' : 'Error',
  description: 'This page could not be found.'
})
</script>
