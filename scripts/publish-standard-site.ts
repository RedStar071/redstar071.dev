/**
 * Publishes the blog to the AT Protocol as standard.site records: one
 * `site.standard.publication` for the site and one `site.standard.document` per
 * post in `content/blog/`. Records are keyed deterministically (see
 * `shared/atproto.ts`), so running it again updates them in place.
 *
 *   pnpm atproto:publish              write the records
 *   pnpm atproto:publish --dry-run    show what would be written, no login
 *   pnpm atproto:publish --prune      also delete documents without a post
 */
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  ATPROTO_DID,
  COLLECTIONS,
  documentRkey,
  listRecords,
  PUBLICATION_RKEY,
  PUBLICATION_URI,
  resolvePds,
  SITE_URL
} from "../shared/atproto.ts";
import { findAnnouncement, persistAnnouncement } from "./_discover.ts";
import { createSession, readFlags } from "./_session.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const blogDir = join(root, "content/blog");
const wellKnownPath = join(root, "public/.well-known/site.standard.publication");
const { dryRun, prune } = readFlags();

interface Post {
  file: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  bluesky?: string;
  text: string;
}

/** The palette from DESIGN.md: night page, pale text, WolfStar red accent. */
const basicTheme = {
  $type: "site.standard.theme.basic",
  background: { $type: "site.standard.theme.color#rgb", r: 10, g: 14, b: 18 },
  foreground: { $type: "site.standard.theme.color#rgb", r: 241, g: 244, b: 247 },
  accent: { $type: "site.standard.theme.color#rgb", r: 251, g: 44, b: 54 },
  accentForeground: { $type: "site.standard.theme.color#rgb", r: 21, g: 26, b: 32 }
};

/**
 * Throws rather than skipping, so a missing directory or a malformed post
 * can't be read as "no posts" and prune every `site.standard.document` record.
 */
async function readPosts(): Promise<Post[]> {
  if (!existsSync(blogDir)) {
    throw new Error(`${blogDir} does not exist`);
  }

  const posts: Post[] = [];
  for (const file of (await readdir(blogDir)).filter(name => name.endsWith(".md"))) {
    const source = await readFile(join(blogDir, file), "utf8");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
      throw new Error(`${file} has no frontmatter`);
    }
    const data = parse(match[1]!) as Record<string, unknown>;
    if (typeof data.title !== "string" || data.date === undefined) {
      throw new Error(`${file} needs a title and a date`);
    }
    posts.push({
      file: join(blogDir, file),
      slug: basename(file, ".md"),
      title: data.title,
      description: typeof data.description === "string" ? data.description : "",
      date: new Date(data.date as string).toISOString(),
      bluesky: typeof data.bluesky === "string" ? data.bluesky : undefined,
      text: toPlainText(match[2]!)
    });
  }
  return posts;
}

/** A rough markdown-to-text pass; `textContent` is only used for search and previews. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_~>]/g, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

/** A strong ref needs the post's CID, which only the repo knows. */
async function resolveBskyPostRef(uri: string | undefined) {
  const prefix = `at://${ATPROTO_DID}/app.bsky.feed.post/`;
  if (!uri?.startsWith(prefix)) {
    return undefined;
  }

  const url = new URL("/xrpc/com.atproto.repo.getRecord", await resolvePds());
  url.searchParams.set("repo", ATPROTO_DID);
  url.searchParams.set("collection", "app.bsky.feed.post");
  url.searchParams.set("rkey", uri.slice(prefix.length));
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    console.warn(`could not read ${uri} (${response.status}), leaving bskyPostRef out`);
    return undefined;
  }
  const { cid } = await response.json() as { cid: string };
  return { uri, cid };
}

const posts = await readPosts();

// A post without a `bluesky` key may have been announced since it was written.
for (const post of posts.filter(post => !post.bluesky)) {
  const uri = await findAnnouncement({ url: `${SITE_URL}/blog/${post.slug}`, publishedAt: new Date(post.date) });
  if (uri) {
    post.bluesky = uri;
    console.info(`announcement ${uri}  /blog/${post.slug}`);
    if (!dryRun) {
      await persistAnnouncement(post.file, uri);
    }
  }
}

const wellKnownMatches = existsSync(wellKnownPath) && (await readFile(wellKnownPath, "utf8")) === PUBLICATION_URI;

console.info(`publication  ${PUBLICATION_URI}`);
for (const post of posts) {
  console.info(`document     ${documentRkey({ date: post.date, slug: post.slug })}  /blog/${post.slug}`);
}

if (dryRun) {
  if (!wellKnownMatches) {
    console.info("well-known   public/.well-known/site.standard.publication is out of date");
  }
  console.info("\n--dry-run: nothing was written.");
  process.exit(0);
}

const session = await createSession();
const siteDescription = (parse(await readFile(join(root, "content/index.yml"), "utf8")) as { description?: string }).description;

await session.putRecord(COLLECTIONS.publication, PUBLICATION_RKEY, {
  $type: COLLECTIONS.publication,
  url: SITE_URL,
  name: "RedStar",
  description: siteDescription,
  preferences: { showInDiscover: true },
  basicTheme
});

const expected = new Set<string>();
for (const post of posts) {
  const rkey = documentRkey({ date: post.date, slug: post.slug });
  expected.add(rkey);
  await session.putRecord(COLLECTIONS.document, rkey, {
    $type: COLLECTIONS.document,
    site: PUBLICATION_URI,
    path: `/blog/${post.slug}`,
    title: post.title,
    publishedAt: post.date,
    description: post.description || undefined,
    textContent: post.text || undefined,
    bskyPostRef: await resolveBskyPostRef(post.bluesky)
  });
}

if (!wellKnownMatches) {
  await writeFile(wellKnownPath, PUBLICATION_URI);
  console.info("updated public/.well-known/site.standard.publication");
}

for (const record of await listRecords(COLLECTIONS.document)) {
  if (expected.has(record.rkey)) {
    continue;
  }
  if (prune) {
    await session.deleteRecord(COLLECTIONS.document, record.rkey);
    console.info(`deleted stale document ${record.rkey}`);
  } else {
    console.info(`stale document ${record.rkey} has no matching post (--prune removes it)`);
  }
}

console.info(`\npublished 1 publication and ${posts.length} document(s).`);
