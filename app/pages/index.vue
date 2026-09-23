<template>
  <div v-if="page">
    <LandingProfileHero :page />

    <UContainer class="mt-16 flex flex-col gap-4 sm:mt-20">
      <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-4">
          <BentoCard
            :title="page.about.title"
            icon="i-material-symbols-waving-hand-outline-rounded"
            shape="cookie"
            tone="solid"
            class="[--i:6]"
          >
            <ul class="space-y-3">
              <li
                v-for="item in page.about.items"
                :key="item"
                class="flex gap-3 text-lg text-toned"
              >
                <StarSticker
                  variant="solid"
                  class="mt-1.5 size-4 shrink-0"
                />
                {{ item }}
              </li>
            </ul>
          </BentoCard>

          <BentoCard
            :title="page.socials.title"
            icon="i-material-symbols-connect-without-contact-rounded"
            shape="flower"
            class="[--i:8]"
          >
            <ul class="flex flex-col gap-0.5 overflow-hidden rounded-lg">
              <LinkRow
                v-for="social in socials"
                :key="social.label"
                :to="social.to"
                :title="social.handle"
                :description="social.label"
                :icon="social.icon"
              />
            </ul>
            <template #actions>
              <UButton
                :to="`mailto:${global.email}`"
                label="contact"
                icon="i-material-symbols-mail-outline-rounded"
                variant="soft"
              />
            </template>
          </BentoCard>
        </div>

        <div class="flex min-w-0 flex-col gap-4">
          <BentoCard
            :title="page.projects.title"
            icon="i-material-symbols-deployed-code-outline-rounded"
            shape="burst"
            class="[--i:7]"
          >
            <ul class="flex flex-col gap-0.5 overflow-hidden rounded-lg">
              <LinkRow
                v-for="project in featured"
                :key="project.id"
                :to="project.url ?? project.repo"
                :title="project.title"
                :description="project.description"
              >
                <template #leading>
                  <ProjectLogo :project />
                </template>
              </LinkRow>
            </ul>
            <template #actions>
              <UButton
                to="/projects"
                label="all projects"
                trailing-icon="i-material-symbols-arrow-forward-rounded"
                variant="soft"
              />
            </template>
          </BentoCard>

          <BentoCard
            :title="page.presence.title"
            icon="i-material-symbols-graphic-eq-rounded"
            shape="sunny"
            class="[--i:9]"
          >
            <LandingDiscordPresence />
          </BentoCard>

          <LandingLastFmNowPlaying :title="page.listening.title" />
        </div>
      </div>

      <BentoCard
        :title="page.stack.title"
        icon="i-material-symbols-construction-rounded"
        shape="clover"
        class="[--i:11]"
      >
        <ul class="grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg sm:grid-cols-5 lg:grid-cols-10">
          <li
            v-for="tool in page.stack.items"
            :key="tool.label"
            class="flex items-center gap-3 rounded-xs bg-elevated px-4 py-3 sm:aspect-square sm:flex-col sm:justify-center sm:gap-2.5 sm:px-2"
          >
            <UIcon
              :name="tool.icon"
              class="size-6 shrink-0 text-highlighted sm:size-8"
            />
            <span class="font-mono text-xs text-muted sm:text-center">{{ tool.label }}</span>
          </li>
        </ul>
      </BentoCard>

      <BentoCard
        v-if="posts?.length"
        :title="page.writing.title"
        icon="i-material-symbols-ink-pen-outline-rounded"
        shape="star"
        class="[--i:12]"
      >
        <ul class="flex flex-col gap-0.5 overflow-hidden rounded-lg">
          <LinkRow
            v-for="post in posts"
            :key="post.path"
            :to="post.path"
            :title="post.title"
            :description="`${formatDate(post.date)} · ${post.minRead} min read`"
            icon="i-material-symbols-description-outline-rounded"
          />
        </ul>
        <template #actions>
          <UButton
            to="/blog"
            label="all writing"
            trailing-icon="i-material-symbols-arrow-forward-rounded"
            variant="soft"
          />
        </template>
      </BentoCard>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData("index", () => queryCollection("index").first());
if (!page.value) {
  throw createError({ status: 404, statusText: "Page not found", fatal: true });
}

const [{ data: projects }, { data: posts }] = await Promise.all([
  useAsyncData("index-projects", () => queryCollection("projects").order("order", "ASC").all()),
  useAsyncData("index-posts", () => queryCollection("blog").order("date", "DESC").limit(3).all())
]);

const featured = computed(() => projects.value?.filter(project => project.featured).slice(0, 4) ?? []);

const { global, socials } = useAppConfig();

useSeoMeta({
  title: page.value.seo.title || page.value.title,
  titleTemplate: "%s",
  ogTitle: page.value.seo.title || page.value.title,
  description: page.value.seo.description || page.value.description,
  ogDescription: page.value.seo.description || page.value.description
});

defineOgImage("Profile", {
  title: page.value.title,
  description: page.value.description
});

useComponentEmbed(site => buildProfileCard(site, page.value!, featured.value));
</script>
