<template>
  <UContainer
    v-if="page"
    class="py-12 sm:py-16"
  >
    <header class="max-w-2xl motion-safe:animate-rise">
      <div class="flex items-center gap-3">
        <ShapeBadge
          icon="i-material-symbols-deployed-code-outline-rounded"
          shape="burst"
          tone="solid"
        />
        <p class="font-mono text-sm text-muted">
          {{ projects?.length }} projects
        </p>
      </div>
      <h1 class="mt-5 text-5xl leading-none font-black tracking-tight text-balance text-highlighted font-round sm:text-6xl">
        {{ page.title }}
      </h1>
      <p class="mt-4 text-lg text-pretty text-toned">
        {{ page.description }}
      </p>
    </header>

    <ul class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
      <li
        v-for="(project, index) in projects"
        :key="project.id"
        class="motion-safe:animate-rise"
        :style="{ '--i': index + 1 }"
      >
        <article class="group relative flex h-full flex-col rounded-2xl bg-muted p-5 transition-[border-radius,background-color] duration-300 ease-(--ease-effects) hover:rounded-lg sm:p-6">
          <div class="flex items-start gap-4">
            <ProjectLogo
              :project
              size="lg"
            />
            <div class="min-w-0 flex-1">
              <h2 class="text-2xl font-medium tracking-tight text-highlighted">
                <ULink
                  :to="project.url ?? project.repo"
                  target="_blank"
                  raw
                  class="after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary"
                >
                  {{ project.title }}
                  <span class="sr-only">(opens in a new tab)</span>
                </ULink>
              </h2>
              <p class="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-sm text-muted">
                <span>{{ project.role }}</span>
                <span aria-hidden="true">·</span>
                <span>since {{ project.since }}</span>
                <UBadge
                  v-if="project.status !== 'active'"
                  :label="project.status"
                  color="neutral"
                  variant="subtle"
                  class="rounded-full font-mono"
                />
              </p>
            </div>
            <UIcon
              name="i-material-symbols-arrow-outward-rounded"
              class="size-6 shrink-0 text-muted transition-[translate,color] duration-300 ease-(--ease-spatial) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            />
          </div>
          <p class="mt-4 text-pretty text-toned">
            {{ project.description }}
          </p>
          <div class="mt-auto flex flex-wrap items-center gap-1.5 pt-5">
            <span
              v-for="tag in project.tags"
              :key="tag"
              class="rounded-full bg-elevated px-3 py-1 font-mono text-xs text-muted"
            >{{ tag }}</span>
            <UButton
              v-if="project.url"
              :to="project.repo"
              target="_blank"
              label="source"
              icon="i-simple-icons-github"
              color="neutral"
              variant="ghost"
              size="sm"
              class="relative z-10 ml-auto"
              :aria-label="`${project.title} source on GitHub (opens in a new tab)`"
            />
          </div>
        </article>
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData("projects-page", () => queryCollection("pages").path("/projects").first());
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
}

const { data: projects } = await useAsyncData("projects", () => queryCollection("projects").order("order", "ASC").all());

useSeoMeta({
  title: "projects",
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description
});

defineOgImageComponent("Profile", {
  title: page.value.title,
  description: page.value.description
});

useComponentEmbed(site => buildProjectsCard(site, page.value!, projects.value ?? []));
</script>
