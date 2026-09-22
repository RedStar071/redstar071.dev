/**
 * Syncs the site to the AT Protocol at the end of a deploy build: the blog as
 * standard.site records and, once, the projects as `dev.redstar071.project`
 * records. Adapted from danielroe/roe.dev's `modules/sync`.
 *
 *   pnpm run deploy                  builds with --sync, so the records are written
 *   pnpm generate --dry-run          shows what would be written, no login
 *
 * A plain `pnpm generate` or `pnpm build` skips it, so a local build never
 * writes to the PDS. Writing needs `ATPROTO_APP_PASSWORD` in `.env`.
 */
import type { SyncPost, SyncProject } from "./providers";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import process from "node:process";
import { defineNuxtModule, useLogger, useNuxt } from "nuxt/kit";
import { parse } from "yaml";
import { syncAll } from "./providers";

const logger = useLogger("sync");

export default defineNuxtModule({
  meta: { name: "sync" },
  setup() {
    const nuxt = useNuxt();
    if (nuxt.options.dev || nuxt.options.test || nuxt.options._prepare) {
      return;
    }

    const dryRun = process.argv.includes("--dry-run");
    const isDeploy = process.argv.includes("--sync");

    if (!dryRun && !isDeploy) {
      logger.info("Skipped (pass --sync or --dry-run)");
      return;
    }

    const contentDir = join(nuxt.options.rootDir, "content");

    // A failed sync is logged rather than thrown: the records can catch up on
    // the next deploy, the site itself should still ship.
    nuxt.hook("modules:done", async () => {
      try {
        const [posts, projects] = await Promise.all([
          readPosts(join(contentDir, "blog")),
          readProjects(join(contentDir, "projects"))
        ]);

        logger.info(`${dryRun ? "Dry run" : "Syncing"}: ${posts.length} post(s), ${projects.size} project(s)`);
        await syncAll({ posts, projects }, { dryRun });
        logger.info("Complete");
      } catch (error) {
        logger.warn("Failed:", error instanceof Error ? error.message : error);
      }
    });
  }
});

/**
 * Throws rather than skipping, so a missing directory or a malformed post
 * can't be read as "no posts" and delete every `site.standard.document` record.
 */
async function readPosts(blogDir: string): Promise<SyncPost[]> {
  if (!existsSync(blogDir)) {
    throw new Error(`${blogDir} does not exist`);
  }

  const posts: SyncPost[] = [];
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

async function readProjects(projectsDir: string): Promise<Map<string, SyncProject>> {
  const projects = new Map<string, SyncProject>();
  for (const file of (await readdir(projectsDir)).filter(name => name.endsWith(".yml"))) {
    projects.set(basename(file, ".yml"), parse(await readFile(join(projectsDir, file), "utf8")));
  }
  return projects;
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
