/**
 * The site's AT Protocol identity and the record keys shared by the pages and
 * the publish scripts in `scripts/`. Reading and writing records goes through
 * airspace (`shared/airspace.ts`); this file has no dependencies, so a page can
 * import it without pulling the client into its bundle.
 */

export const SITE_URL = "https://redstar071.dev";
export const ATPROTO_HANDLE = "redstar071.dev";
/** Stable across handle and PDS changes, so it is the one value to hard-code. */
export const ATPROTO_DID = "did:plc:zyotuutsuhmy3hxck6h7cigo";

export const COLLECTIONS = {
  publication: "site.standard.publication",
  document: "site.standard.document"
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
