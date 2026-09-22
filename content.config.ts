import type { ProjectRecord } from "./shared/atproto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCollection, defineCollectionSource, defineContentConfig, z } from "@nuxt/content";
import { parse } from "yaml";
import { COLLECTIONS, isProjectRecord, listRecords } from "./shared/atproto";

function createBaseSchema() {
  return z.object({
    title: z.string(),
    description: z.string()
  });
}

function createCardSchema() {
  return z.object({
    title: z.string().nonempty()
  });
}

function createAuthorSchema() {
  return z.object({
    name: z.string(),
    description: z.string().optional(),
    username: z.string().optional(),
    to: z.string().optional(),
    avatar: z.object({
      src: z.string().editor({ input: "media" }),
      alt: z.string()
    }).optional()
  });
}

const projectsDir = fileURLToPath(new URL("./content/projects", import.meta.url));

/** The `content/projects/*.yml` files, used when the PDS has no readable projects. */
async function readProjectFiles(): Promise<Map<string, ProjectRecord>> {
  const projects = new Map<string, ProjectRecord>();
  for (const file of (await readdir(projectsDir)).filter(name => name.endsWith(".yml"))) {
    projects.set(basename(file, ".yml"), parse(await readFile(join(projectsDir, file), "utf8")));
  }
  return projects;
}

/**
 * Projects are `dev.redstar071.project` records in the PDS. Any failure to read
 * them (offline, PDS down, nothing published yet) falls back to the YAML files,
 * so a build never depends on the network being up.
 */
let projectsRequest: Promise<Map<string, ProjectRecord>> | undefined;
function loadProjects() {
  projectsRequest ??= (async () => {
    try {
      const records = await listRecords(COLLECTIONS.project);
      const projects = new Map<string, ProjectRecord>();
      for (const record of records) {
        if (isProjectRecord(record.value)) {
          projects.set(record.rkey, record.value);
        } else {
          console.warn(`[projects] ignoring ${record.uri}: it does not match the project shape`);
        }
      }
      if (projects.size > 0) {
        return projects;
      }
      console.info("[projects] no records in the PDS yet, using content/projects/*.yml");
    } catch (error) {
      console.warn(`[projects] could not read the PDS (${error instanceof Error ? error.message : error}), using content/projects/*.yml`);
    }
    return readProjectFiles();
  })();
  return projectsRequest;
}

const projectsSource = defineCollectionSource({
  getKeys: async () => [...(await loadProjects()).keys()].map(rkey => `${rkey}.json`),
  getItem: async (key) => {
    const project = (await loadProjects()).get(key.replace(/\.json$/, ""));
    if (!project) {
      throw new Error(`unknown project ${key}`);
    }
    return { ...project };
  }
});

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: "page",
      source: "index.yml",
      schema: z.object({
        hero: z.object({
          greeting: z.string().nonempty(),
          bio: z.string().nonempty()
        }),
        about: createCardSchema().extend({
          items: z.array(z.string().nonempty())
        }),
        socials: createCardSchema(),
        projects: createCardSchema(),
        presence: createCardSchema(),
        stack: createCardSchema().extend({
          items: z.array(z.object({
            label: z.string().nonempty(),
            icon: z.string().nonempty().editor({ input: "icon" })
          }))
        }),
        writing: createCardSchema()
      })
    }),
    projects: defineCollection({
      type: "data",
      source: projectsSource,
      schema: z.object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
        role: z.string().nonempty(),
        logo: z.string().editor({ input: "media" }).optional(),
        icon: z.string().editor({ input: "icon" }).optional(),
        url: z.string().optional(),
        repo: z.string().nonempty(),
        tags: z.array(z.string()),
        since: z.number().int(),
        status: z.enum(["active", "in development", "archived"]),
        featured: z.boolean().default(false),
        order: z.number().int()
      })
    }),
    blog: defineCollection({
      type: "page",
      source: "blog/*.md",
      schema: z.object({
        minRead: z.number(),
        date: z.date(),
        // at:// URI of the Bluesky post announcing this article; its replies show as comments
        bluesky: z.string()
          .regex(/^at:\/\/[^/]+\/app\.bsky\.feed\.post\/[^/]+$/, "must be a full at:// URI, e.g. at://did:plc:xyz/app.bsky.feed.post/abc123")
          .optional(),
        image: z.string().editor({ input: "media" }).optional(),
        author: createAuthorSchema().optional()
      })
    }),
    pages: defineCollection({
      type: "page",
      source: [
        { include: "projects.yml" },
        { include: "blog.yml" }
      ],
      schema: createBaseSchema()
    })
  }
});
