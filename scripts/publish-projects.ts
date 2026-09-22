/**
 * Writes the projects in `content/projects/*.yml` to the PDS as
 * `dev.redstar071.project` records, keyed by file name. This is the migration
 * path: once records exist the site reads them instead of the YAML, and
 * editing them (with this script, or a record editor such as pdsls.dev) is
 * what changes the site.
 *
 *   pnpm atproto:projects              write the records
 *   pnpm atproto:projects --dry-run    validate and list, no login
 *   pnpm atproto:projects --prune      also delete records without a YAML file
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { COLLECTIONS, isProjectRecord, listRecords } from "../shared/atproto.ts";
import { createSession, readFlags } from "./_session.ts";

const projectsDir = fileURLToPath(new URL("../content/projects", import.meta.url));
const { dryRun, prune } = readFlags();

const files = (await readdir(projectsDir)).filter(name => name.endsWith(".yml"));
const projects = new Map<string, Record<string, unknown>>();
for (const file of files) {
  const data = parse(await readFile(join(projectsDir, file), "utf8")) as Record<string, unknown>;
  if (!isProjectRecord(data)) {
    throw new Error(`${file} does not match the dev.redstar071.project shape`);
  }
  projects.set(basename(file, ".yml"), data);
}

for (const [rkey, project] of projects) {
  console.info(`${rkey.padEnd(28)} ${project.title}`);
}

if (dryRun) {
  console.info(`\n--dry-run: ${projects.size} project(s) are valid, nothing was written.`);
  process.exit(0);
}

const session = await createSession();
for (const [rkey, project] of projects) {
  await session.putRecord(COLLECTIONS.project, rkey, { $type: COLLECTIONS.project, ...project });
}

for (const record of await listRecords(COLLECTIONS.project)) {
  if (projects.has(record.rkey)) {
    continue;
  }
  if (prune) {
    await session.deleteRecord(COLLECTIONS.project, record.rkey);
    console.info(`deleted ${record.rkey}`);
  } else {
    console.info(`${record.rkey} has no YAML file (--prune removes it)`);
  }
}

console.info(`\nwrote ${projects.size} project record(s).`);
