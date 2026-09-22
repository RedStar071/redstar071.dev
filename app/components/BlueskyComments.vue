<template>
  <section
    aria-labelledby="comments-heading"
    class="mt-10"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2
        id="comments-heading"
        class="text-2xl font-medium text-highlighted"
      >
        comments
      </h2>
      <UButton
        :to="threadUrl"
        target="_blank"
        label="reply on Bluesky"
        icon="i-simple-icons-bluesky"
        color="neutral"
        variant="subtle"
      />
    </div>

    <div
      v-if="status === 'pending'"
      class="mt-4 flex flex-col gap-2"
      aria-hidden="true"
    >
      <USkeleton class="h-24 w-full rounded-xl" />
      <USkeleton class="h-24 w-full rounded-xl" />
    </div>

    <div
      v-else-if="error"
      class="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-muted p-4 text-toned"
    >
      <p>couldn't load the replies.</p>
      <UButton
        label="try again"
        color="neutral"
        variant="soft"
        @click="refresh()"
      />
    </div>

    <ul
      v-else-if="replies.length"
      class="mt-4 flex flex-col gap-2"
    >
      <BlueskyComment
        v-for="reply in replies"
        :key="reply.post.uri"
        :reply
      />
    </ul>

    <p
      v-else
      class="mt-4 text-muted"
    >
      nothing here yet. reply to the post on Bluesky and it shows up here.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { BlueskyThread } from "~/utils/bluesky";
import { isThreadPost, sortedReplies } from "~/utils/bluesky";

const { uri } = defineProps<{ uri: string }>();

// The site is prerendered, so replies load in the browser to stay current.
const { data, status, error, refresh } = useFetch<BlueskyThread>("https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread", {
  key: `bluesky-thread-${uri}`,
  query: { uri, depth: 6, parentHeight: 0 },
  server: false,
  lazy: true
});

const replies = computed(() => data.value && isThreadPost(data.value.thread) ? sortedReplies(data.value.thread.replies) : []);

const threadUrl = computed(() => {
  const [did, , rkey] = uri.replace("at://", "").split("/");
  return `https://bsky.app/profile/${did}/post/${rkey}`;
});
</script>
