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
const { global, socials } = useAppConfig();

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

if (import.meta.server) {
  useSchemaOrg([
    definePerson({
      name: global.name,
      image: global.avatar,
      jobTitle: "Discord Bot & Open Source Developer",
      description: "I'm RedStar, a developer from Italy. I maintain WolfStar, a Discord moderation bot, and build open-source TypeScript tooling for Discord apps and the web.",
      sameAs: socials.filter(social => social.to.startsWith("https://")).map(social => social.to),
      email: `mailto:${global.email}`,
      knowsAbout: ["TypeScript", "Vue", "Nuxt", "Node.js", "discord.js", "Tailwind CSS", "Docker", "Kubernetes", "PostgreSQL", "Cloudflare"],
      homeLocation: {
        "@type": "Place",
        "name": global.location,
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IT"
        }
      }
    }),
    defineWebSite({
      name: global.name,
      description: "I build Discord bots and open-source tooling for the web, from Italy.",
      author: {
        "@type": "Person",
        "name": global.name
      }
    })
  ]);
}

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
