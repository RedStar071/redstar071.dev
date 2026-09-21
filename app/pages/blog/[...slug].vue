<template>
  <UContainer
    v-if="page"
    class="max-w-3xl py-12 sm:py-16"
  >
    <UButton
      to="/blog"
      label="writing"
      icon="i-material-symbols-arrow-back-rounded"
      color="neutral"
      variant="ghost"
      class="-ml-3"
    />

    <header class="mt-8 motion-safe:animate-rise">
      <p class="font-mono text-sm text-muted">
        <time :datetime="new Date(page.date).toISOString()">{{ formatDate(page.date) }}</time>
        · {{ page.minRead }} min read
      </p>
      <h1 class="mt-3 text-4xl leading-tight font-black tracking-tight text-balance text-highlighted font-round sm:text-5xl">
        {{ page.title }}
      </h1>
      <p class="mt-4 text-lg text-pretty text-toned">
        {{ page.description }}
      </p>
      <UUser
        v-if="page.author"
        v-bind="page.author"
        class="mt-6"
      />
    </header>

    <NuxtImg
      v-if="page.image"
      :src="page.image"
      :alt="page.title"
      class="mt-8 aspect-video w-full rounded-2xl object-cover"
    />

    <div class="mt-10 motion-safe:animate-rise [--i:2]">
      <ContentRenderer
        v-if="page.body"
        :value="page"
      />
    </div>

    <div class="mt-10 flex justify-end">
      <UButton
        label="copy link"
        icon="i-material-symbols-link-rounded"
        color="neutral"
        variant="subtle"
        @click="copyToClipboard(articleLink, 'Link copied to clipboard')"
      />
    </div>

    <USeparator class="my-10" />

    <UContentSurround :surround />
  </UContainer>
</template>

<script setup lang="ts">
const route = useRoute()
const site = useSiteConfig()

const { data: page } = await useAsyncData(route.path, () => queryCollection('blog').path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryCollectionItemSurroundings('blog', route.path, {
  fields: ['description']
}))

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

if (page.value.image) {
  defineOgImage({ url: page.value.image })
} else {
  defineOgImageComponent('Profile', { title, description })
}

const articleLink = computed(() => `${site.url}${route.path}`)
</script>
