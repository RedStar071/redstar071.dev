/**
 * Finds the Bluesky post that announced an article, so its replies can be shown
 * as comments without pasting the URI by hand. Adapted from the discovery in
 * danielroe/roe.dev's `modules/bsky-comments.ts`, run by the standard.site sync
 * provider before it writes the documents.
 */
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import process from "node:process";
import { ATPROTO_DID } from "../../shared/atproto";

const DAY = 24 * 60 * 60 * 1000;

/**
 * A post counts as the announcement only shortly after publication. Without an
 * upper bound, an article that was never announced would match whichever later
 * post happens to link to it, and its replies would be a different conversation.
 */
const ANNOUNCEMENT_WINDOW = 7 * DAY;

interface FeedItem {
  reason?: unknown;
  post: {
    uri: string;
    record: {
      createdAt: string;
      facets?: Array<{ features: Array<{ $type: string; uri?: string }> }>;
      embed?: { external?: { uri?: string } };
    };
    embed?: { external?: { uri?: string } };
  };
}

const withoutTrailingSlash = (url: string) => url.replace(/\/$/, "");

/** Every URL a post points at: link facets in its text, and its link card. */
function linksOf({ post }: FeedItem): string[] {
  const links = post.record.facets?.flatMap(facet => facet.features)
    .filter(feature => feature.$type === "app.bsky.richtext.facet#link" && feature.uri)
    .map(feature => feature.uri!) ?? [];
  const card = post.embed?.external?.uri ?? post.record.embed?.external?.uri;
  return card ? [...links, card] : links;
}

export async function findAnnouncement(options: { url: string; publishedAt: Date; actor?: string }): Promise<string | undefined> {
  const { url, publishedAt, actor = ATPROTO_DID } = options;
  const searchStart = publishedAt.getTime() - DAY;
  const searchEnd = publishedAt.getTime() + ANNOUNCEMENT_WINDOW;

  let cursor: string | undefined;
  const matches: Array<{ uri: string; createdAt: number }> = [];

  do {
    const feedUrl = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed");
    feedUrl.searchParams.set("actor", actor);
    feedUrl.searchParams.set("filter", "posts_no_replies");
    feedUrl.searchParams.set("limit", "100");
    if (cursor) {
      feedUrl.searchParams.set("cursor", cursor);
    }

    const response = await fetch(feedUrl, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      throw new Error(`getAuthorFeed answered ${response.status}`);
    }
    const page = await response.json() as { cursor?: string; feed: FeedItem[] };

    let reachedOlderPosts = false;
    for (const item of page.feed) {
      // a repost of someone else's link is not this site's announcement
      if (item.reason) {
        continue;
      }
      const createdAt = new Date(item.post.record.createdAt).getTime();
      if (createdAt < searchStart) {
        reachedOlderPosts = true;
        continue;
      }
      if (createdAt <= searchEnd && linksOf(item).some(link => withoutTrailingSlash(link) === withoutTrailingSlash(url))) {
        matches.push({ uri: item.post.uri, createdAt });
      }
    }

    // the feed is newest first, so a page that reaches back before the window is the last one worth reading
    cursor = reachedOlderPosts ? undefined : page.cursor;
  } while (cursor);

  return matches.sort((a, b) => a.createdAt - b.createdAt)[0]?.uri;
}

/** Records `uri` as the `bluesky` frontmatter key of the post at `file`. */
export async function persistAnnouncement(file: string, uri: string): Promise<void> {
  const source = await readFile(file, "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) {
    throw new Error(`${file} has no frontmatter`);
  }

  const line = `bluesky: '${uri}'`;
  const updated = /^bluesky:.*$/m.test(frontmatter[1]!)
    ? frontmatter[1]!.replace(/^bluesky:.*$/m, line)
    : `${frontmatter[1]}\n${line}`;
  const contents = source.replace(frontmatter[0], `---\n${updated}\n---`);

  // Written through a temp file and renamed into place, so a post's
  // frontmatter is never left half-written if the process is interrupted.
  const tmpFile = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(tmpFile, contents);
    await rename(tmpFile, file);
  } finally {
    await rm(tmpFile, { force: true }).catch(() => {});
  }
}
