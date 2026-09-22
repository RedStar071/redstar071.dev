/**
 * Asks Spotify for the refresh token the README listening card reads with.
 *
 * Create an app at https://developer.spotify.com/dashboard with the redirect URI
 * below, put its id and secret in .env, then run this and sign in:
 *
 *   NUXT_SPOTIFY_CLIENT_ID=...
 *   NUXT_SPOTIFY_CLIENT_SECRET=...
 *
 *   pnpm spotify:token
 *
 * It prints the refresh token to store as `NUXT_SPOTIFY_REFRESH_TOKEN`
 * (`wrangler secret put NUXT_SPOTIFY_REFRESH_TOKEN` for the Worker). Spotify
 * expires it six months after this sign-in: run it again when the card falls
 * back to Last.fm.
 */
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import process from "node:process";

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = ["user-read-currently-playing", "user-read-recently-played"];

const clientId = process.env.NUXT_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.NUXT_SPOTIFY_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Set NUXT_SPOTIFY_CLIENT_ID and NUXT_SPOTIFY_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.search = new URLSearchParams({
  client_id: clientId,
  response_type: "code",
  redirect_uri: REDIRECT_URI,
  scope: SCOPES.join(" "),
  state
}).toString();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", REDIRECT_URI);
  if (url.pathname !== "/callback") {
    response.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  if (url.searchParams.get("state") !== state || !code) {
    response.writeHead(400).end(`Sign-in failed: ${url.searchParams.get("error") ?? "state mismatch"}`);
    return;
  }

  const token = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI })
  }).then(res => res.json() as Promise<{ refresh_token?: string; error_description?: string }>);

  if (!token.refresh_token) {
    response.writeHead(500).end(`Spotify did not return a refresh token: ${token.error_description ?? "unknown error"}`);
    console.error(token);
    process.exitCode = 1;
  } else {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" }).end("Done, back to the terminal.");
    console.info(`\nNUXT_SPOTIFY_REFRESH_TOKEN=${token.refresh_token}\n`);
  }
  server.close();
});

server.listen(PORT, "127.0.0.1", () => {
  console.info(`Add ${REDIRECT_URI} as a redirect URI of the Spotify app, then open:\n\n${authorizeUrl}\n`);
});
