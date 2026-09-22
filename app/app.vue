<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        shortcut="meta_k"
        :links="navLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const { global } = useAppConfig();

// Matches --ui-bg: night-950 in dark mode, night-100 in light mode.
const color = computed(() => colorMode.value === "dark" ? "#0a0e12" : "#f1f4f7");

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color }
  ],
  link: [
    { rel: "icon", href: "/favicon.ico" },
    { rel: "alternate", type: "application/rss+xml", title: global.name, href: "/rss.xml" }
  ],
  htmlAttrs: {
    lang: "en"
  }
});

useSeoMeta({
  titleTemplate: `%s · ${global.name}`,
  twitterCard: "summary_large_image",
  twitterCreator: "@redstar071"
});

defineOgImage("Profile");

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData("navigation", () => {
    return Promise.all([
      queryCollectionNavigation("blog")
    ]);
  }, {
    transform: data => data.flat()
  }),
  useLazyAsyncData("search", () => {
    return Promise.all([
      queryCollectionSearchSections("blog")
    ]);
  }, {
    server: false,
    transform: data => data.flat()
  })
]);

provide("navigation", navigation);
</script>
