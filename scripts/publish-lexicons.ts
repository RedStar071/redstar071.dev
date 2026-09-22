/**
 * Publishes the schemas in `lexicons/` to the PDS as
 * `com.atproto.lexicon.schema` records, so anyone can resolve a
 * `dev.redstar071.*` NSID to its definition. Adapted from danielroe/roe.dev's
 * `scripts/publish-lex.ts`, without its `airspace` CLI.
 *
 * Resolution also needs a DNS TXT record on the authority, which this cannot
 * create for you:
 *
 *   _lexicon.redstar071.dev   TXT   "did=did:plc:zyotuutsuhmy3hxck6h7cigo"
 *
 *   pnpm atproto:lexicons              write the records
 *   pnpm atproto:lexicons --dry-run    list what would be written, no login
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ATPROTO_DID } from "../shared/atproto.ts";
import { createSession, readFlags } from "./_session.ts";

const SCHEMA_COLLECTION = "com.atproto.lexicon.schema";
const lexiconsDir = fileURLToPath(new URL("../lexicons", import.meta.url));
const { dryRun } = readFlags();

const files = (await readdir(lexiconsDir, { recursive: true })).filter(name => name.endsWith(".json"));
const lexicons = new Map<string, Record<string, unknown>>();
for (const file of files) {
  const lexicon = JSON.parse(await readFile(join(lexiconsDir, file), "utf8")) as { id?: string };
  if (typeof lexicon.id !== "string") {
    throw new TypeError(`${file} has no lexicon id`);
  }
  lexicons.set(lexicon.id, lexicon as Record<string, unknown>);
}

for (const id of lexicons.keys()) {
  console.info(`${SCHEMA_COLLECTION}/${id}`);
}

if (dryRun) {
  // Set the exit code rather than calling process.exit(), which can cut off
  // console output still pending a flush when stdout isn't a TTY (e.g. in CI).
  console.info(`\n--dry-run: ${lexicons.size} lexicon(s) found, nothing was written.`);
  process.exitCode = 0;
} else {
  const session = await createSession();
  for (const [id, lexicon] of lexicons) {
    await session.putRecord(SCHEMA_COLLECTION, id, { $type: SCHEMA_COLLECTION, ...lexicon });
  }

  console.info(`\nwrote ${lexicons.size} lexicon(s). Add the DNS record below so they resolve:`);
  console.info(`  _lexicon.redstar071.dev  TXT  "did=${ATPROTO_DID}"`);
}
