import type { l } from "@atproto/lex-schema";
import type { site } from "../../../shared/lex/index.ts";
import type { BuildAirspace } from "../../shared/airspace";
import type { SyncContent, SyncOptions, SyncPost, SyncProvider } from "./index";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { useLogger } from "nuxt/kit";
import { parse } from "yaml";
import { ATPROTO_DID, documentRkey, PUBLICATION_RKEY, PUBLICATION_URI, SITE_URL } from "../../../shared/atproto";
import { useBuildAirspaceWithSession } from "../../shared/airspace";
import { findAnnouncement, persistAnnouncement } from "../discover";

const logger = useLogger("sync:standard-site");

/** The palette from DESIGN.md: night page, pale text, WolfStar red accent. */
const basicTheme = {
  $type: "site.standard.theme.basic",
  background: { $type: "site.standard.theme.color#rgb", r: 10, g: 14, b: 18 },
  foreground: { $type: "site.standard.theme.color#rgb", r: 241, g: 244, b: 247 },
  accent: { $type: "site.standard.theme.color#rgb", r: 251, g: 44, b: 54 },
  accentForeground: { $type: "site.standard.theme.color#rgb", r: 21, g: 26, b: 32 }
} satisfies site.standard.theme.basic.Main;

const indexPath = fileURLToPath(new URL("../../../content/index.yml", import.meta.url));

async function siteDescription(): Promise<string | undefined> {
  const { description } = parse(await readFile(indexPath, "utf8")) as { description?: unknown };
  return typeof description === "string" ? description : undefined;
}

/**
 * Publishes the blog as standard.site records: one `site.standard.publication`
 * for the site and one `site.standard.document` per post. Records are keyed
 * deterministically (see `shared/atproto.ts`), so every deploy updates them in
 * place, and documents without a post are deleted. Adapted from
 * danielroe/roe.dev's `modules/sync/providers/standard-site.ts`.
 */
export class StandardSiteProvider implements SyncProvider {
  name = "standard-site";

  async sync({ posts }: SyncContent, { dryRun }: SyncOptions): Promise<void> {
    await discoverAnnouncements(posts, { dryRun });

    if (dryRun) {
      logger.info(`Would sync ${posts.length} blog post(s) as AT Protocol documents`);
      logger.info(`  publication ${PUBLICATION_URI}`);
      for (const post of posts) {
        logger.info(`  /blog/${post.slug} (rkey: ${documentRkey(post)}): ${post.title}`);
      }
      return;
    }

    const airspace = await useBuildAirspaceWithSession();

    try {
      await airspace.publication.put(PUBLICATION_RKEY, {
        url: SITE_URL as l.UriString,
        name: "RedStar",
        description: await siteDescription(),
        preferences: { showInDiscover: true },
        basicTheme
      }, { ifChanged: true });
    } catch (error) {
      logger.warn("Failed to update publication record:", error instanceof Error ? error.message : error);
    }

    const expectedRkeys = new Set(posts.map(post => documentRkey(post)));

    // Delete any existing records that don't match a current blog post
    try {
      for (const record of await airspace.documents.list()) {
        if (!expectedRkeys.has(record.rkey)) {
          logger.info(`Deleting stale record with rkey: ${record.rkey}`);
          await airspace.documents.delete(record.rkey);
        }
      }
    } catch (error) {
      logger.warn("Failed to clean up stale records:", error instanceof Error ? error.message : error);
    }

    let updated = 0;
    for (const post of posts) {
      const { changed } = await airspace.documents.put(documentRkey(post), {
        site: PUBLICATION_URI as l.UriString,
        path: `/blog/${post.slug}`,
        title: post.title,
        publishedAt: post.date as l.DatetimeString,
        description: post.description || undefined,
        textContent: post.text || undefined,
        bskyPostRef: await resolveBskyPostRef(airspace, post.bluesky)
      }, { ifChanged: true });
      if (changed) {
        updated++;
      }
    }

    logger.info(`Done: ${updated} updated, ${posts.length - updated} unchanged`);
  }
}

/**
 * A post without a `bluesky` key may have been announced since it was written.
 * A discovered URI is written back into the post's frontmatter, so the next
 * build (and the comments on the page) pick it up. A failed lookup only costs
 * that post its discovery.
 */
async function discoverAnnouncements(posts: SyncPost[], { dryRun }: SyncOptions): Promise<void> {
  for (const post of posts.filter(post => !post.bluesky)) {
    try {
      const uri = await findAnnouncement({ url: `${SITE_URL}/blog/${post.slug}`, publishedAt: new Date(post.date) });
      if (!uri) {
        continue;
      }
      post.bluesky = uri;
      logger.info(`Found announcement ${uri} for /blog/${post.slug}`);
      if (!dryRun) {
        await persistAnnouncement(post.file, uri);
      }
    } catch (error) {
      logger.warn(`Failed to look up a Bluesky announcement for ${post.slug}:`, error instanceof Error ? error.message : error);
    }
  }
}

/** A strong ref needs the post's CID as well as its URI, so the post is read back from the repo. */
async function resolveBskyPostRef(airspace: BuildAirspace, uri: string | undefined) {
  if (!uri?.startsWith(`at://${ATPROTO_DID}/app.bsky.feed.post/`)) {
    return undefined;
  }

  try {
    const post = await airspace.resolve(uri);
    if (post) {
      return { uri: post.uri, cid: post.cid };
    }
  } catch (error) {
    logger.warn(`Failed to resolve Bluesky post ${uri}:`, error instanceof Error ? error.message : error);
  }
  return undefined;
}
