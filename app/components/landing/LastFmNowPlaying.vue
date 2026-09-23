<template>
  <BentoCard
    :title
    icon="i-material-symbols-graphic-eq-rounded"
    shape="sunny"
    class="[--i:10]"
  >
    <div aria-live="polite">
      <div
        v-if="track"
        class="group/track relative isolate flex min-h-56 flex-col justify-between overflow-hidden rounded-lg p-4 sm:min-h-64"
        :class="hasCover ? 'bg-primary-950' : 'bg-primary-100 dark:bg-primary-950'"
      >
        <img
          v-if="hasCover"
          :src="track.image!"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 -z-20 size-full scale-105 object-cover transition-transform duration-700 ease-(--ease-spatial) group-hover/track:scale-110"
        />
        <UIcon
          v-else
          name="i-material-symbols-album-rounded"
          aria-hidden="true"
          class="absolute -right-8 -bottom-10 -z-20 size-40 text-primary-200 dark:text-primary-900"
          :class="{ 'motion-safe:animate-spin-slow': track.isNowPlaying }"
        />
        <div
          v-if="hasCover"
          class="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-black/10"
        ></div>

        <p
          class="relative flex items-center gap-1.5 font-mono text-xs"
          :class="hasCover ? 'text-white/80' : 'text-primary-700 dark:text-primary-300'"
        >
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

        <div class="relative flex items-end gap-4">
          <div class="min-w-0 flex-1">
            <ULink
              :to="trackUrl"
              target="_blank"
              raw
              class="block truncate text-2xl font-bold hover:underline"
              :class="hasCover ? 'text-white' : 'text-primary-800 dark:text-primary-200'"
            >
              {{ track.title }}
            </ULink>

            <p
              class="truncate text-sm"
              :class="hasCover ? 'text-white/70' : 'text-toned'"
            >
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
            class="shrink-0 opacity-70 transition-opacity hover:opacity-100"
            :class="hasCover ? 'text-white' : 'text-primary-700 dark:text-primary-300'"
          >
            <UIcon
              name="i-simple-icons-lastdotfm"
              class="size-4"
            />
            <span class="sr-only">powered by Last.fm (opens in a new tab)</span>
          </ULink>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-start gap-3 rounded-lg bg-elevated p-4"
      >
        <p class="text-toned">
          {{ status === "pending" ? "checking Last.fm for a scrobble…" : "nothing scrobbled recently, so i can't tell you what i'm listening to." }}
        </p>
        <UButton
          label="try again"
          icon="i-material-symbols-refresh-rounded"
          color="neutral"
          variant="subtle"
          size="sm"
          :loading="status === 'pending'"
          @click="refresh()"
        />
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

// Awaited so the server-rendered markup already has a track (or the empty state) at first paint.
const { data: track, status, refresh } = await useFetch<LastFmTrack | null>("/api/lastfm", {
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
const hasCover = computed(() => !!track.value?.image);

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
