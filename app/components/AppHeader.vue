<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default/80 backdrop-blur-md">
    <UContainer class="flex h-16 items-center justify-between gap-4">
      <ULink
        to="/"
        raw
        class="group flex items-center gap-2.5 rounded-full py-1 pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <NuxtImg
          provider="github"
          :src="global.avatar"
          alt=""
          width="32"
          height="32"
          densities="x1 x2"
          class="size-8 rounded-full bg-elevated"
        />
        <span class="text-lg font-extrabold tracking-tight text-highlighted font-round">{{ global.name }}</span>
        <StarSticker
          variant="solid"
          class="size-3.5 transition-transform duration-700 ease-(--ease-spatial) group-hover:rotate-[144deg]"
        />
        <span class="sr-only">, home</span>
      </ULink>

      <nav aria-label="Main">
        <ul class="flex items-center gap-1">
          <li
            v-for="link in links"
            :key="String(link.to)"
          >
            <UButton
              :to="link.to"
              :icon="link.icon"
              color="neutral"
              variant="ghost"
              active-color="primary"
              active-variant="soft"
              :aria-label="link.label"
            >
              <span class="max-sm:hidden">{{ link.label }}</span>
            </UButton>
          </li>
          <li>
            <UButton
              :to="github?.to"
              target="_blank"
              icon="i-simple-icons-github"
              color="neutral"
              variant="ghost"
              aria-label="GitHub (opens in a new tab)"
            />
          </li>
          <li>
            <ColorModeButton />
          </li>
        </ul>
      </nav>
    </UContainer>
  </header>
</template>

<script setup lang="ts">
const { global, socials } = useAppConfig();
const github = socials.find(social => social.label === "GitHub");

const { data: postCount } = await useAsyncData("blog-count", () => queryCollection("blog").count());

// The writing link only shows up once there is something to read.
const links = computed(() => navLinks.filter(link => link.to !== "/" && (link.to !== "/blog" || postCount.value)));
</script>
