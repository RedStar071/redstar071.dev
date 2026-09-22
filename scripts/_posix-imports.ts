/**
 * `lex build` joins import paths with the platform separator, so on Windows the
 * generated files import `'./..\\..\\com\\atproto\\...'`. Rewrites them with
 * forward slashes, so `shared/lex` is the same whichever OS generated it.
 * Run by `pnpm lex:gen` after the build.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const lexDir = fileURLToPath(new URL("../shared/lex", import.meta.url));

for (const file of await readdir(lexDir, { recursive: true })) {
  if (!file.endsWith(".ts")) {
    continue;
  }
  const path = join(lexDir, file);
  const source = await readFile(path, "utf8");
  const fixed = source.replace(/(from\s+')([^']+)(')/g, (_, open: string, specifier: string, close: string) =>
    `${open}${specifier.replace(/\\+/g, "/").replace(/^\.\/\.\.\//, "../")}${close}`);
  if (fixed !== source) {
    await writeFile(path, fixed);
  }
}
