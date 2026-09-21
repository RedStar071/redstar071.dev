/**
 * The site's AT Protocol identity and the few helpers shared by the build
 * (`content.config.ts`), the pages and the publish scripts in `scripts/`.
 *
 * Plain `fetch` only, so it also runs under `node` without Nuxt's auto-imports.
 */

export const SITE_URL = "https://redstar071.dev";
export const ATPROTO_HANDLE = "redstar071.dev";
/** Stable across handle and PDS changes, so it is the one value to hard-code. */
export const ATPROTO_DID = "did:plc:zyotuutsuhmy3hxck6h7cigo";

export const COLLECTIONS = {
  publication: "site.standard.publication",
  document: "site.standard.document",
  project: "dev.redstar071.project"
} as const;

const TID_ALPHABET = "234567abcdefghijklmnopqrstuvwxyz";

/**
 * A TID (the record key `site.standard.*` records use) built from a date, so
 * the same post always maps to the same record. The 10-bit clock id is derived
 * from `salt`, which keeps two posts published on the same day apart.
 */
export function tidFromDate(date: string | number | Date, salt = ""): string {
  let clockId = 2166136261;
  for (const char of salt) {
    clockId = Math.imul(clockId ^ char.charCodeAt(0), 16777619) >>> 0;
  }

  // 53 bits of microseconds, then the 10-bit clock id. Built without BigInt literals: the bundler targets es2019.
  let value = (BigInt(new Date(date).getTime()) * BigInt(1000) << BigInt(10)) | BigInt(clockId % 1024);
  let tid = "";
  for (let i = 0; i < 13; i++) {
    tid = TID_ALPHABET[Number(value & BigInt(31))] + tid;
    value >>= BigInt(5);
  }
  return tid;
}

/** The publication is a singleton, so its key is fixed rather than tied to a post. */
export const PUBLICATION_RKEY = tidFromDate("2026-09-21T00:00:00.000Z", "publication");
export const PUBLICATION_URI = `at://${ATPROTO_DID}/${COLLECTIONS.publication}/${PUBLICATION_RKEY}`;

/** The rkey a blog post's `site.standard.document` record is stored under. */
export function documentRkey(post: { date: string | number | Date; slug: string }): string {
  return tidFromDate(post.date, post.slug);
}

export function documentUri(post: { date: string | number | Date; slug: string }): string {
  return `at://${ATPROTO_DID}/${COLLECTIONS.document}/${documentRkey(post)}`;
}

export interface AtprotoRecord<T = unknown> {
  uri: string;
  cid: string;
  rkey: string;
  value: T;
}

let pdsRequest: Promise<string> | undefined;

/** Resolves the PDS that holds the site's repo from the DID document. */
export function resolvePds(): Promise<string> {
  pdsRequest ??= (async () => {
    const response = await fetch(`https://plc.directory/${ATPROTO_DID}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      throw new Error(`plc.directory answered ${response.status}`);
    }
    const document = await response.json() as { service?: Array<{ id: string; serviceEndpoint: string }> };
    const endpoint = document.service?.find(service => service.id.endsWith("#atproto_pds"))?.serviceEndpoint;
    if (!endpoint) {
      throw new Error(`${ATPROTO_DID} has no #atproto_pds service`);
    }
    return endpoint;
  })();
  pdsRequest.catch(() => {
    pdsRequest = undefined;
  });
  return pdsRequest;
}

/** Lists every public record of a collection, following pagination. */
export async function listRecords<T = unknown>(collection: string): Promise<Array<AtprotoRecord<T>>> {
  const pds = await resolvePds();
  const records: Array<AtprotoRecord<T>> = [];
  let cursor: string | undefined;

  do {
    const url = new URL("/xrpc/com.atproto.repo.listRecords", pds);
    url.searchParams.set("repo", ATPROTO_DID);
    url.searchParams.set("collection", collection);
    url.searchParams.set("limit", "100");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      throw new Error(`listRecords ${collection} answered ${response.status}`);
    }
    const page = await response.json() as { cursor?: string; records: Array<{ uri: string; cid: string; value: T }> };
    for (const record of page.records) {
      records.push({ ...record, rkey: record.uri.split("/").pop()! });
    }
    cursor = page.cursor;
  } while (cursor);

  return records;
}

/**
 * The shape of a `dev.redstar071.project` record. It mirrors the `projects`
 * collection in `content.config.ts` and `lexicons/dev/redstar071/project.json`.
 */
export interface ProjectRecord {
  title: string;
  description: string;
  role: string;
  logo?: string;
  icon?: string;
  url?: string;
  repo: string;
  tags: string[];
  since: number;
  status: "active" | "in development" | "archived";
  featured: boolean;
  order: number;
}

const PROJECT_STATUSES = ["active", "in development", "archived"];

export function isProjectRecord(value: unknown): value is ProjectRecord {
  const project = value as Partial<ProjectRecord> | null;
  return typeof project === "object" && project !== null
    && typeof project.title === "string" && project.title !== ""
    && typeof project.description === "string" && project.description !== ""
    && typeof project.role === "string" && project.role !== ""
    && typeof project.repo === "string" && project.repo !== ""
    && Array.isArray(project.tags) && project.tags.every(tag => typeof tag === "string")
    && Number.isInteger(project.since)
    && typeof project.status === "string" && PROJECT_STATUSES.includes(project.status)
    && typeof project.featured === "boolean"
    && Number.isInteger(project.order);
}
