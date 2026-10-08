<template>
  <BentoCard
    :title
    icon="i-simple-icons-spotify"
    shape="sunny"
    class="[--i:11]"
  >
    <ul
      v-if="tracks.length"
      aria-live="polite"
      class="flex flex-col gap-0.5 overflow-hidden rounded-lg"
    >
      <li
        v-for="track in tracks"
        :key="track.url + (track.playedAt ?? 'now')"
      >
        <ULink
          :to="track.url"
          target="_blank"
          raw
          class="flex items-center gap-3 bg-elevated px-3 py-2 transition-colors hover:bg-accented"
        >
          <img
            v-if="track.image"
            :src="track.image"
            alt=""
            width="40"
            height="40"
            loading="lazy"
            class="size-10 shrink-0 rounded-xs object-cover"
          />
          <UIcon
            v-else
            name="i-material-symbols-album-rounded"
            aria-hidden="true"
            class="size-10 shrink-0 text-toned"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate font-bold">{{ track.title }}</span>
            <span class="block truncate text-sm text-toned">{{ track.artist }}</span>
          </span>
          <span
            v-if="track.isNowPlaying"
            aria-hidden="true"
            class="flex h-3 shrink-0 items-end gap-0.5 text-primary"
          >
            <span
              v-for="(bar, index) in EQUALIZER_BARS"
              :key="index"
              class="w-0.5 origin-bottom rounded-full bg-current motion-safe:animate-equalize"
              :style="{ 'height': bar.height, '--delay': bar.delay }"
            ></span>
          </span>
          <ClientOnly v-else-if="track.playedAt">
            <span class="shrink-0 font-mono text-xs text-toned">{{ formatAgo(track.playedAt) }}</span>
          </ClientOnly>
          <span
            v-if="track.isNowPlaying"
            class="sr-only"
          >playing now</span>
        </ULink>
      </li>
    </ul>

    <div
      v-else
      class="flex flex-col items-start gap-3 rounded-lg bg-elevated p-4"
    >
      <p class="text-toned">
        {{ status === "pending" ? "checking Spotify…" : "nothing to show from Spotify right now." }}
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

    <template #actions>
      <UButton
        :to="`https://open.spotify.com/user/${SPOTIFY_USER_ID}`"
        target="_blank"
        label="Spotify"
        icon="i-simple-icons-spotify"
        variant="soft"
      />
    </template>
  </BentoCard>
</template>

<script setup lang="ts">
interface SpotifyTrack {
  title: string;
  artist: string;
  album: string | null;
  image: string | null;
  url: string;
  isNowPlaying: boolean;
  playedAt: number | null;
}

defineProps<{ title: string }>();

const { data, status, refresh } = await useFetch<SpotifyTrack[]>("/api/spotify", {
  key: "spotify-recent",
  default: () => []
});
const tracks = computed(() => data.value ?? []);

// "/" is prerendered, so hydration reuses the build-time payload: fetch a fresh one right away.
onMounted(() => refresh());

const visibility = useDocumentVisibility();
useIntervalFn(() => {
  if (visibility.value === "visible")
    refresh();
}, LISTENING_REFRESH_INTERVAL);

const now = useNow({ interval: 30_000 });
function formatAgo(timestamp: number) {
  const minutes = Math.max(0, Math.round((now.value.getTime() - timestamp) / 60_000));
  if (minutes < 1)
    return "now";
  if (minutes < 60)
    return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}
</script>
