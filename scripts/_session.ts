/**
 * A minimal authenticated XRPC client for the publish scripts. It logs in with
 * an app password (never the account password) read from `ATPROTO_APP_PASSWORD`.
 */
import process from "node:process";
import { ATPROTO_DID, ATPROTO_HANDLE, resolvePds } from "../shared/atproto.ts";

export interface Session {
  did: string;
  pds: string;
  procedure: <T = unknown>(nsid: string, body: unknown) => Promise<T>;
  upload: (data: Uint8Array, mimeType: string) => Promise<unknown>;
  putRecord: (collection: string, rkey: string, record: unknown) => Promise<void>;
  deleteRecord: (collection: string, rkey: string) => Promise<void>;
}

export async function createSession(): Promise<Session> {
  const password = process.env.ATPROTO_APP_PASSWORD;
  if (!password) {
    throw new Error("Set ATPROTO_APP_PASSWORD (an app password from Bluesky settings) in .env, or run with --dry-run.");
  }

  const pds = await resolvePds();
  const login = await fetch(new URL("/xrpc/com.atproto.server.createSession", pds), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: ATPROTO_HANDLE, password }),
    signal: AbortSignal.timeout(8000)
  });
  if (!login.ok) {
    throw new Error(`Login failed (${login.status}): ${await login.text()}`);
  }
  const { accessJwt, did } = await login.json() as { accessJwt: string; did: string };
  if (did !== ATPROTO_DID) {
    throw new Error(`Logged in as ${did}, but the site is configured for ${ATPROTO_DID}.`);
  }

  async function request<T>(nsid: string, body: BodyInit, contentType: string): Promise<T> {
    const response = await fetch(new URL(`/xrpc/${nsid}`, pds), {
      method: "POST",
      headers: { "authorization": `Bearer ${accessJwt}`, "content-type": contentType },
      body,
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      throw new Error(`${nsid} failed (${response.status}): ${await response.text()}`);
    }
    return await response.json() as T;
  }

  return {
    did,
    pds,
    procedure: (nsid, body) => request(nsid, JSON.stringify(body), "application/json"),
    upload: async (data, mimeType) => {
      const { blob } = await request<{ blob: unknown }>("com.atproto.repo.uploadBlob", data as BodyInit, mimeType);
      return blob;
    },
    putRecord: async (collection, rkey, record) => {
      await request("com.atproto.repo.putRecord", JSON.stringify({ repo: did, collection, rkey, record }), "application/json");
    },
    deleteRecord: async (collection, rkey) => {
      await request("com.atproto.repo.deleteRecord", JSON.stringify({ repo: did, collection, rkey }), "application/json");
    }
  };
}

/** `--dry-run` and `--prune`, the only flags the publish scripts take. */
export function readFlags() {
  const args = new Set(process.argv.slice(2));
  return { dryRun: args.has("--dry-run"), prune: args.has("--prune") };
}
