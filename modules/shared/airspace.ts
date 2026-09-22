/**
 * Build-time airspace clients, for `content.config.ts` and the sync module,
 * which run before any Nitro runtime exists. Adapted from danielroe/roe.dev's
 * `modules/shared/airspace.ts`.
 */
import process from "node:process";
import { createAirspace, passwordSession } from "airspace";
import { ATPROTO_DID, ATPROTO_HANDLE } from "../../shared/atproto";
import { collections } from "../../shared/collections";

let readOnly: ReturnType<typeof createReadOnlyAirspace> | undefined;

function createReadOnlyAirspace() {
  // The DID rather than the handle: it survives a handle change, and resolving
  // it is one request to plc.directory for the PDS, made on the first read.
  return createAirspace({ identity: ATPROTO_DID, collections });
}

/** Unauthenticated reads against our own PDS. */
export function useBuildAirspace() {
  return readOnly ??= createReadOnlyAirspace();
}

/**
 * A client that can write, for the sync providers. Logs in with an app
 * password (never the account password) from `ATPROTO_APP_PASSWORD`.
 */
export async function useBuildAirspaceWithSession() {
  const password = process.env.ATPROTO_APP_PASSWORD;
  if (!password) {
    throw new Error("atproto credentials are not configured (missing ATPROTO_APP_PASSWORD, an app password from Bluesky settings).");
  }

  const { did, service } = await useBuildAirspace().identity();
  const session = await passwordSession({ service, identifier: ATPROTO_HANDLE, password });
  if (session.did !== ATPROTO_DID) {
    throw new Error(`Logged in as ${session.did}, but the site is configured for ${ATPROTO_DID}.`);
  }

  return createAirspace({ identity: { did, service }, collections, session });
}

export type BuildAirspace = Awaited<ReturnType<typeof useBuildAirspaceWithSession>>;
