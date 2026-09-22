<template>
  <div aria-live="polite">
    <div
      v-if="!presence && (status === 'idle' || status === 'pending')"
      class="space-y-3"
    >
      <div class="flex items-center gap-3">
        <USkeleton class="size-12 rounded-full" />
        <div class="space-y-2">
          <USkeleton class="h-4 w-36" />
          <USkeleton class="h-3 w-20" />
        </div>
      </div>
      <USkeleton class="h-28 w-full rounded-lg" />
      <span class="sr-only">Loading Discord presence</span>
    </div>

    <div
      v-else-if="!presence"
      class="flex flex-col items-start gap-3 rounded-lg bg-elevated p-4"
    >
      <p class="text-toned">
        couldn't reach Discord just now, so i can't tell you what i'm up to.
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

    <div
      v-else
      class="space-y-3"
    >
      <div class="flex items-center gap-3">
        <span class="relative shrink-0">
          <img
            :src="avatarUrl"
            alt=""
            width="48"
            height="48"
            class="size-12 rounded-full bg-elevated"
          />
          <span
            class="absolute -right-0.5 -bottom-0.5 size-4 rounded-full ring-4 ring-(--ui-bg-muted)"
            :class="statusColors[presence.discord_status]"
          ></span>
        </span>
        <div class="min-w-0">
          <p class="truncate font-medium text-highlighted">
            {{ displayName }}
          </p>
          <p class="font-mono text-sm text-muted">
            {{ statusLabels[presence.discord_status] }}<template v-if="platform">
              · on {{ platform }}
            </template>
          </p>
        </div>
      </div>

      <p
        v-if="customStatus"
        class="rounded-lg bg-elevated px-4 py-3 text-toned"
      >
        <span
          v-if="customStatus.emoji && !customStatus.emoji.id"
          aria-hidden="true"
        >{{ customStatus.emoji.name }}</span>
        {{ customStatus.state }}
      </p>

      <ULink
        v-if="presence.spotify"
        :to="spotifyUrl"
        target="_blank"
        raw
        class="group/spotify relative block overflow-hidden rounded-lg bg-primary-100 p-4 transition-[border-radius] duration-300 ease-(--ease-effects) hover:rounded-xl dark:bg-primary-950"
      >
        <UIcon
          name="i-material-symbols-music-note-rounded"
          class="absolute -right-6 -bottom-8 size-40 text-primary-200 transition-transform duration-700 ease-(--ease-spatial) group-hover/spotify:-rotate-12 dark:text-primary-900"
        />
        <div class="relative flex items-center gap-4">
          <img
            v-if="presence.spotify.album_art_url"
            :src="presence.spotify.album_art_url"
            :alt="`${presence.spotify.album} cover`"
            width="64"
            height="64"
            class="size-16 shrink-0 rounded-md"
          />
          <div class="min-w-0">
            <p class="flex items-center gap-1.5 font-mono text-xs text-primary-700 dark:text-primary-300">
              <UIcon
                name="i-simple-icons-spotify"
                class="size-3.5"
              />
              listening on Spotify
            </p>
            <p class="mt-1 truncate text-xl font-bold text-primary-800 dark:text-primary-200">
              {{ presence.spotify.song }}
            </p>
            <p class="truncate text-sm text-toned">
              {{ presence.spotify.artist }}
            </p>
          </div>
        </div>
        <div class="relative mt-4 flex items-center gap-3 font-mono text-xs text-toned">
          <span>{{ formatClock(spotifyElapsed) }}</span>
          <span
            class="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-200 dark:bg-primary-900"
            role="progressbar"
            aria-label="Track progress"
            :aria-valuenow="Math.round(spotifyProgress * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span
              class="block h-full origin-left rounded-full bg-primary transition-transform duration-1000 ease-linear"
              :style="{ transform: `scaleX(${spotifyProgress})` }"
            ></span>
          </span>
          <span>{{ formatClock(spotifyDuration) }}</span>
        </div>
        <span class="sr-only">(opens in a new tab)</span>
      </ULink>

      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-center gap-3 rounded-lg bg-elevated p-3"
      >
        <img
          v-if="activityImage(activity)"
          :src="activityImage(activity)!"
          alt=""
          width="48"
          height="48"
          class="size-12 shrink-0 rounded-md bg-accented object-cover"
        />
        <ShapeBadge
          v-else
          icon="i-material-symbols-sports-esports-outline-rounded"
          shape="clover"
          tone="neutral"
        />
        <div class="min-w-0">
          <p class="font-mono text-xs text-muted">
            {{ activityVerbs[activity.type] }}<template v-if="activity.timestamps?.start">
              · for {{ formatSince(activity.timestamps.start) }}
            </template>
          </p>
          <p class="truncate font-medium text-highlighted">
            {{ activity.name }}
          </p>
          <p
            v-if="activity.details || activity.state"
            class="truncate text-sm text-muted"
          >
            {{ [activity.details, activity.state].filter(Boolean).join(' · ') }}
          </p>
        </div>
      </div>

      <p
        v-if="!presence.spotify && !activities.length && !customStatus"
        class="rounded-lg bg-elevated px-4 py-3 text-toned"
      >
        {{ presence.discord_status === 'offline' ? 'offline right now, but messages still reach me.' : 'not playing anything right now.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LanyardActivity } from "~/composables/useDiscordPresence";

const { data: presence, status, refresh } = useDiscordPresence();

const visibility = useDocumentVisibility();
useIntervalFn(() => {
  if (visibility.value === "visible")
    refresh();
}, PRESENCE_REFRESH_INTERVAL);

const now = useNow({ interval: 1000 });

const displayName = computed(() => presence.value?.discord_user.global_name || presence.value?.discord_user.username);

const avatarUrl = computed(() => {
  const user = presence.value?.discord_user;
  if (!user?.avatar)
    return DISCORD_DEFAULT_AVATAR;
  return `${DISCORD_CDN}/avatars/${user.id}/${user.avatar}.png?size=96`;
});

const platform = computed(() => {
  if (!presence.value)
    return null;
  if (presence.value.active_on_discord_desktop)
    return "desktop";
  if (presence.value.active_on_discord_mobile)
    return "mobile";
  if (presence.value.active_on_discord_web)
    return "web";
  return null;
});

const customStatus = computed(() => presence.value?.activities.find(activity => activity.type === 4 && activity.state));

// Spotify gets its own block, custom status is shown above.
const activities = computed(() => presence.value?.activities.filter(activity => activity.type !== 4 && !(activity.type === 2 && activity.name === "Spotify")) ?? []);

const activityVerbs: Record<LanyardActivity["type"], string> = {
  0: "playing",
  1: "streaming",
  2: "listening to",
  3: "watching",
  4: "",
  5: "competing in"
};

const spotifyUrl = computed(() => presence.value?.spotify?.track_id ? `${SPOTIFY_URL}/track/${presence.value.spotify.track_id}` : SPOTIFY_URL);
const spotifyDuration = computed(() => {
  const timestamps = presence.value?.spotify?.timestamps;
  return timestamps ? timestamps.end - timestamps.start : 0;
});
const spotifyElapsed = computed(() => {
  const timestamps = presence.value?.spotify?.timestamps;
  if (!timestamps)
    return 0;
  return Math.min(Math.max(now.value.getTime() - timestamps.start, 0), spotifyDuration.value);
});
const spotifyProgress = computed(() => spotifyDuration.value ? spotifyElapsed.value / spotifyDuration.value : 0);

function formatClock(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatSince(start: number) {
  const minutes = Math.max(1, Math.round((now.value.getTime() - start) / 60_000));
  if (minutes < 60)
    return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}
</script>
