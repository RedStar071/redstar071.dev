<template>
  <section
    aria-labelledby="hero-title"
    class="relative"
  >
    <div
      aria-hidden="true"
      class="relative h-48 overflow-hidden sm:h-64 lg:h-72"
    >
      <svg class="absolute inset-y-0 left-0 h-full w-[calc(100%+720px)] mask-b-from-20% mask-b-to-95% motion-safe:animate-drift">
        <defs>
          <pattern
            id="hero-waves"
            width="720"
            height="120"
            patternUnits="userSpaceOnUse"
            patternTransform="skewY(-18.435)"
          >
            <path
              :d="WAVE_PATH"
              class="fill-primary-500"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#hero-waves)"
        />
      </svg>
      <StarSticker
        v-for="(star, index) in stars"
        :key="index"
        twinkle
        class="absolute drop-shadow-lg drop-shadow-black/25"
        :class="star"
      />
    </div>

    <UContainer class="relative -mt-24 flex flex-col items-center text-center sm:-mt-28">
      <div class="group relative motion-safe:animate-rise">
        <div class="shape-cookie bg-default p-2 transition-transform duration-700 ease-(--ease-spatial) group-hover:rotate-[20deg]">
          <div class="shape-cookie overflow-hidden bg-elevated">
            <NuxtImg
              provider="github"
              :src="global.avatar"
              width="192"
              height="192"
              densities="x1 x2"
              preload
              fetchpriority="high"
              :alt="`${global.name}'s avatar: a cartoon wolf with a spiked collar, surrounded by red stars`"
              class="size-40 transition-transform duration-700 ease-(--ease-spatial) group-hover:-rotate-[20deg] sm:size-48"
            />
          </div>
        </div>
        <span
          v-if="presence"
          class="absolute right-5 bottom-5 size-7 rounded-full ring-[6px] ring-(--ui-bg) motion-safe:animate-rise sm:right-6 sm:bottom-6"
          :class="statusColors[presence.discord_status]"
        >
          <span class="sr-only">{{ statusLabels[presence.discord_status] }} on Discord</span>
        </span>
      </div>

      <p class="mt-6 text-xl font-medium text-muted motion-safe:animate-rise [--i:1] sm:text-2xl">
        {{ page.hero.greeting }}
      </p>
      <h1
        id="hero-title"
        class="relative mt-1 flex items-center gap-2 text-6xl leading-none font-black tracking-tight text-highlighted font-round motion-safe:animate-rise [--i:2] sm:gap-5 sm:text-8xl lg:text-9xl"
      >
        <StarSticker
          twinkle
          class="size-6 shrink-0 -rotate-12 sm:size-12"
        />
        {{ global.name }}
        <StarSticker
          twinkle
          class="size-6 shrink-0 rotate-12 [--delay:1.6s] sm:size-12"
        />
      </h1>
      <p class="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-sm text-muted motion-safe:animate-rise [--i:3]">
        <span>@{{ global.username }}</span>
        <span aria-hidden="true">·</span>
        <span class="inline-flex items-center gap-1">
          <UIcon
            name="i-material-symbols-location-on-outline-rounded"
            class="size-4"
          />
          {{ global.location }}
        </span>
      </p>
      <MDC
        :value="page.hero.bio"
        unwrap="p"
        tag="p"
        class="mt-5 max-w-xl text-lg text-pretty text-toned motion-safe:animate-rise [--i:4]"
      />
      <div class="mt-7 flex flex-wrap justify-center gap-2 motion-safe:animate-rise [--i:5]">
        <UButton
          :to="`mailto:${global.email}`"
          label="say hi"
          icon="i-material-symbols-mail-outline-rounded"
          size="lg"
        />
        <UButton
          :to="github?.to"
          target="_blank"
          label="GitHub"
          icon="i-simple-icons-github"
          color="neutral"
          variant="subtle"
          size="lg"
        />
      </div>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
import type { IndexCollectionItem } from "@nuxt/content";

defineProps<{
  page: IndexCollectionItem;
}>();

const { global, socials } = useAppConfig();
const github = socials.find(social => social.label === "GitHub");

const { data: presence } = useDiscordPresence();

// One wavy band per 720x120 tile; skewing the pattern by atan(1/3) turns it into bignut-style diagonal stripes.
// Shifting by one wavelength (720px) lands on an identical tile, which is what lets the drift loop seamlessly.
const WAVE_PATH = (() => {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let x = 0; x <= 720; x += 30) {
    const y = 30 + 22 * Math.sin((2 * Math.PI * x) / 720);
    top.push(`${x} ${y.toFixed(1)}`);
    bottom.unshift(`${x} ${(y + 60).toFixed(1)}`);
  }
  return `M${top.join("L")}L${bottom.join("L")}Z`;
})();

const stars = [
  "top-[14%] left-[5%] size-8 -rotate-12",
  "top-[56%] left-[14%] size-5 rotate-6 [--delay:1.1s] max-sm:hidden",
  "top-[22%] left-[25%] size-11 rotate-12 [--delay:2.3s]",
  "top-[8%] left-[40%] size-5 -rotate-6 [--delay:0.6s] max-sm:hidden",
  "top-[10%] left-[60%] size-7 rotate-[20deg] [--delay:3.1s]",
  "top-[44%] left-[74%] size-10 -rotate-[8deg] [--delay:1.7s]",
  "top-[16%] left-[86%] size-5 rotate-3 [--delay:0.3s] max-sm:hidden",
  "top-[58%] left-[92%] size-7 rotate-[14deg] [--delay:2.7s]"
];
</script>
