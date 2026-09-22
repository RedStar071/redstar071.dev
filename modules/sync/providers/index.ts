import type { RecordInput } from "airspace";
import type { projects } from "../../../shared/collections";
import { ProjectsProvider } from "./projects";
import { StandardSiteProvider } from "./standard-site";

export interface SyncPost {
  /** Absolute path of the markdown file, so a discovered announcement can be written back. */
  file: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  /** `at://` URI of the Bluesky post announcing this post, if there is one. */
  bluesky?: string;
  text: string;
}

export type SyncProject = RecordInput<typeof projects.schema>;

export interface SyncContent {
  posts: SyncPost[];
  /** `content/projects/*.yml`, keyed by file name. */
  projects: Map<string, SyncProject>;
}

export interface SyncOptions {
  dryRun: boolean;
}

export interface SyncProvider {
  name: string;
  sync: (content: SyncContent, options: SyncOptions) => Promise<void>;
}

function createProviders(): SyncProvider[] {
  return [
    new StandardSiteProvider(),
    new ProjectsProvider()
  ];
}

export async function syncAll(content: SyncContent, options: SyncOptions): Promise<void> {
  await Promise.all(createProviders().map(async (provider) => {
    try {
      await provider.sync(content, options);
    } catch (error) {
      console.warn(`[sync:${provider.name}] Failed:`, error instanceof Error ? error.message : error);
    }
  }));
}
