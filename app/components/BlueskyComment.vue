<template>
  <li>
    <article class="rounded-xl bg-elevated p-4">
      <header class="flex items-center gap-3">
        <UAvatar
          :src="reply.post.author.avatar"
          :alt="reply.post.author.displayName || reply.post.author.handle"
          size="sm"
        />
        <div class="min-w-0 flex-1">
          <ULink
            :to="`https://bsky.app/profile/${reply.post.author.handle}`"
            target="_blank"
            raw
            class="block truncate font-medium text-highlighted hover:text-primary"
          >
            {{ reply.post.author.displayName || reply.post.author.handle }}
          </ULink>
          <p class="truncate font-mono text-xs text-muted">
            @{{ reply.post.author.handle }}
          </p>
        </div>
        <ULink
          :to="postUrl"
          target="_blank"
          raw
          class="shrink-0 font-mono text-xs text-muted hover:text-primary"
        >
          <time :datetime="reply.post.record.createdAt">{{ formatDate(reply.post.record.createdAt) }}</time>
          <span class="sr-only">(opens in a new tab)</span>
        </ULink>
      </header>
      <p class="mt-3 text-pretty whitespace-pre-line text-toned">
        {{ reply.post.record.text }}
      </p>
      <p
        v-if="reply.post.likeCount"
        class="mt-3 flex items-center gap-1 font-mono text-xs text-muted"
      >
        <UIcon
          name="i-material-symbols-favorite-outline-rounded"
          class="size-4"
        />
        {{ reply.post.likeCount }}
        <span class="sr-only">likes</span>
      </p>
    </article>

    <ul
      v-if="replies.length"
      class="mt-2 ml-4 flex flex-col gap-2 border-l border-dashed border-default pl-4"
    >
      <BlueskyComment
        v-for="child in replies"
        :key="child.post.uri"
        :reply="child"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import type { BlueskyReply } from "~/utils/bluesky";
import { sortedReplies } from "~/utils/bluesky";

const { reply } = defineProps<{ reply: BlueskyReply }>();

const replies = computed(() => sortedReplies(reply.replies));
const postUrl = computed(() => `https://bsky.app/profile/${reply.post.author.did}/post/${reply.post.uri.split("/").pop()}`);
</script>
