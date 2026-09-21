/** The slice of `app.bsky.feed.defs#threadViewPost` the comments render. */
export interface BlueskyReply {
  $type: "app.bsky.feed.defs#threadViewPost";
  post: {
    uri: string;
    author: { did: string; handle: string; displayName?: string; avatar?: string };
    record: { text: string; createdAt: string };
    likeCount?: number;
  };
  replies?: Array<BlueskyReply | { $type: string }>;
}

export interface BlueskyThread {
  thread: BlueskyReply | { $type: string };
}

export function isThreadPost(node: BlueskyReply | { $type: string }): node is BlueskyReply {
  return node.$type === "app.bsky.feed.defs#threadViewPost";
}

/** Drops blocked and deleted replies, then puts the most liked first. */
export function sortedReplies(replies: BlueskyReply["replies"]): BlueskyReply[] {
  return (replies ?? [])
    .filter(isThreadPost)
    .sort((a, b) => (b.post.likeCount ?? 0) - (a.post.likeCount ?? 0));
}
