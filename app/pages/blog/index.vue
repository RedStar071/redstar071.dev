<template>
  <UContainer
    v-if="page"
    class="py-12 sm:py-16"
  >
    <header class="max-w-2xl motion-safe:animate-rise">
      <ShapeBadge
        icon="i-material-symbols-ink-pen-outline-rounded"
        shape="star"
        tone="solid"
      />
      <h1 class="mt-5 text-5xl leading-none font-black tracking-tight text-balance text-highlighted font-round sm:text-6xl">
        {{ page.title }}
      </h1>
      <p class="mt-4 text-lg text-pretty text-toned">
        {{ page.description }}
      </p>
    </header>

    <ul
      v-if="posts?.length"
      class="mt-10 border-t border-dashed border-default"
    >
      <li
        v-for="(post, index) in posts"
        :key="post.path"
        class="border-b border-dashed border-default motion-safe:animate-rise"
        :style="{ '--i': index + 1 }"
      >
        <ULink
          :to="post.path"
          raw
          class="group -mx-3 flex items-baseline gap-4 rounded-md px-3 py-5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary sm:gap-8"
        >
          <time
            :datetime="new Date(post.date).toISOString()"
            class="w-28 shrink-0 font-mono text-sm text-muted max-sm:hidden"
          >{{ formatDate(post.date) }}</time>
          <span class="min-w-0 flex-1">
            <span class="block text-lg font-medium text-highlighted">{{ post.title }}</span>
            <span class="mt-1 block text-pretty text-muted">{{ post.description }}</span>
            <span class="mt-2 block font-mono text-xs text-muted sm:hidden">{{ formatDate(post.date) }} · {{ post.minRead }} min read</span>
          </span>
          <UIcon
            name="i-material-symbols-arrow-forward-rounded"
            class="size-5 shrink-0 self-center text-muted transition-[translate,color] duration-300 ease-(--ease-spatial) group-hover:translate-x-1 group-hover:text-primary"
          />
        </ULink>
      </li>
    </ul>

    <div
      v-else
      class="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-muted p-6 sm:p-8"
    >
      <StarSticker
        twinkle
        class="size-12"
      />
      <h2 class="text-2xl font-medium text-highlighted">
        nothing here yet
      </h2>
      <p class="max-w-lg text-pretty text-toned">
        the first post is still being written. until then, the code does the talking on GitHub.
      </p>
      <UButton
        :to="github?.to"
        target="_blank"
        label="see what i'm building"
        icon="i-simple-icons-github"
        variant="soft"
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData("blog-page", () => queryCollection("pages").path("/blog").first());
if (!page.value) {
  throw createError({ status: 404, statusText: "Page not found", fatal: true });
}

const { data: posts } = await useAsyncData("blog-posts", () => queryCollection("blog").order("date", "DESC").all());

const { socials } = useAppConfig();
const github = socials.find(social => social.label === "GitHub");

useSeoMeta({
  title: "writing",
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description
});

defineOgImage("Profile", {
  title: page.value.title,
  description: page.value.description
});

useComponentEmbed(site => buildWritingCard(site, page.value!, posts.value ?? []));
</script>
