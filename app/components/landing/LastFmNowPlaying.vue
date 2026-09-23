<template>
  <BentoCard
    v-if="track"
    :title
    icon="i-material-symbols-graphic-eq-rounded"
    shape="sunny"
    class="[--i:10]"
  >
    <div
      aria-live="polite"
      class="relative overflow-hidden rounded-lg bg-primary-100 p-4 dark:bg-primary-950"
    >
      <UIcon
        name="i-material-symbols-album-rounded"
        aria-hidden="true"
        class="absolute -right-8 -bottom-10 size-40 text-primary-200 dark:text-primary-900"
        :class="{ 'motion-safe:animate-spin-slow': track.isNowPlaying }"
      />

      <div class="relative flex items-start gap-4">
        <img
          v-if="track.image"
          :src="track.image"
          :alt="`${track.album || track.title} cover`"
          width="64"
          height="64"
          class="size-16 shrink-0 rounded-md bg-primary-200 object-cover dark:bg-primary-900"
        />
        <div
          v-else
          class="flex size-16 shrink-0 items-center justify-center rounded-md bg-primary-200 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
        >
          <UIcon
            name="i-material-symbols-album-rounded"
            class="size-8"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="flex items-center gap-1.5 font-mono text-xs text-primary-700 dark:text-primary-300">
            <span
              v-if="track.isNowPlaying"
              aria-hidden="true"
              class="flex h-3 items-end gap-0.5"
            >
              <span
                v-for="(bar, index) in EQUALIZER_BARS"
                :key="index"
                class="w-0.5 origin-bottom rounded-full bg-current motion-safe:animate-equalize"
                :style="{ 'height': bar.height, '--delay': bar.delay }"
              ></span>
            </span>
            <UIcon
              v-else
              name="i-simple-icons-lastdotfm"
              class="size-3.5"
            />
            {{ track.isNowPlaying ? "listening now" : "last scrobble" }}
            <ClientOnly v-if="!track.isNowPlaying && track.playedAt">
              <span>· {{ playedAgo }}</span>
            </ClientOnly>
          </p>

          <ULink
            :to="trackUrl"
            target="_blank"
            raw
            class="mt-1 block truncate text-xl font-bold text-primary-800 hover:underline dark:text-primary-200"
          >
            {{ track.title }}
          </ULink>

          <p class="truncate text-sm text-toned">
            <ULink
              :to="artistUrl"
              target="_blank"
              raw
              class="hover:underline"
            >
              {{ track.artist }}
            </ULink><template v-if="track.album"> · {{ track.album }}</template>
          </p>
        </div>

        <ULink
          :to="track.url"
          target="_blank"
          raw
          class="shrink-0 text-primary-700 opacity-60 transition-opacity hover:opacity-100 dark:text-primary-300"
        >
          <UIcon
            name="i-simple-icons-lastdotfm"
            class="size-4"
          />
          <span class="sr-only">powered by Last.fm (opens in a new tab)</span>
        </ULink>
      </div>
    </div>

    <template #actions>
      <UButton
        :to="profileUrl"
        target="_blank"
        label="Gramophone"
        icon="i-material-symbols-album-rounded"
        variant="soft"
      />
    </template>
  </BentoCard>
</template>

<script setup lang="ts">
interface LastFmTrack {
  title: string;
  artist: string;
  album: string | null;
  image: string | null;
  url: string;
  isNowPlaying: boolean;
  playedAt: number | null;
}

defineProps<{ title: string }>();

const config = useRuntimeConfig();

/**
 * Awaited so the server already knows whether there is a scrobble to show: with nothing
 * to say the card never reaches the page, rather than popping in after hydration.
 */
const { data: track, refresh } = await useFetch<LastFmTrack | null>("/api/lastfm", {
  key: "lastfm-now-playing",
  default: () => null
});

// "/" is prerendered, so hydration reuses the build-time payload: fetch a fresh one right away.
onMounted(() => refresh());

const visibility = useDocumentVisibility();
useIntervalFn(() => {
  if (visibility.value === "visible")
    refresh();
}, LISTENING_REFRESH_INTERVAL);

const playedAgo = useTimeAgo(computed(() => track.value?.playedAt ?? Date.now()));

// Links go to Gramophone, an alternative Last.fm frontend; the small logo keeps the credit on Last.fm.
const profileUrl = computed(() => `${GRAMOPHONE_URL}/profile/${encodeURIComponent(config.public.lastfmUsername)}`);
const artistUrl = computed(() => track.value ? `${GRAMOPHONE_URL}/artists/${encodeURIComponent(track.value.artist)}` : GRAMOPHONE_URL);
const trackUrl = computed(() => {
  if (!track.value)
    return GRAMOPHONE_URL;
  // Gramophone keys a track by artist, then the album when Last.fm knows one, then the title.
  const segments = [track.value.artist, track.value.album, track.value.title]
    .filter(segment => !!segment)
    .map(segment => encodeURIComponent(segment!));
  return `${GRAMOPHONE_URL}/tracks/${segments.join("/")}`;
});
</script>
