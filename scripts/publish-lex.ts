/**
 * Publishes the `dev.redstar071.*` schemas in `lexicons.ts` to the PDS as
 * `com.atproto.lexicon.schema` records, so anyone can resolve them. The
 * `airspace` CLI does the work, like danielroe/roe.dev's `scripts/publish-lex.ts`;
 * it only writes schemas under the reversed handle, so the `site.standard.*`
 * ones installed into `lexicons/` are never republished under this account.
 *
 * Resolution also needs a DNS TXT record on the authority, which the CLI
 * prints but cannot create for you:
 *
 *   _lexicon.redstar071.dev   TXT   "did=did:plc:zyotuutsuhmy3hxck6h7cigo"
 *
 *   pnpm lex:publish                   write the records
 *   pnpm lex:publish --dry-run         list what would be written, no login
 *   pnpm lex:publish --prune           also delete schemas no longer in lexicons.ts
 */
import process from "node:process";
import { main } from "airspace/cli";
import { ATPROTO_HANDLE } from "../shared/atproto.ts";

// The CLI reads `AIRSPACE_APP_PASSWORD`; the deploy sync already uses
// `ATPROTO_APP_PASSWORD`, so one .env entry serves both.
process.env.AIRSPACE_APP_PASSWORD ||= process.env.ATPROTO_APP_PASSWORD;

process.exitCode = await main(["lexicons", "publish", "--identity", ATPROTO_HANDLE, ...process.argv.slice(2)]);
