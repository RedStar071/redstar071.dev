import type { H3Event } from "h3";

/** One track, whichever service it came from. */
export interface Track {
  title: string;
  artist: string;
  album: string | null;
  image: string | null;
  url: string;
  isNowPlaying: boolean;
  playedAt: number | null;
  source: "spotify" | "lastfm";
}

interface LastFmApiTrack {
  "name": string;
  "url": string;
  "artist": { "#text": string };
  "album": { "#text": string };
  "image"?: Array<{ "size": string; "#text": string }>;
  "date"?: { uts: string };
  "@attr"?: { nowplaying?: string };
}

interface LastFmApiResponse {
  recenttracks?: { track?: LastFmApiTrack | LastFmApiTrack[] };
  error?: number;
}

interface SpotifyApiTrack {
  name: string;
  external_urls: { spotify: string };
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string; width: number | null }> };
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  currently_playing_type: string;
  item: SpotifyApiTrack | null;
}

interface SpotifyRecentlyPlayed {
  items: Array<{ track: SpotifyApiTrack; played_at: string }>;
}

/** Past this, Spotify and Last.fm are down as far as a card is concerned. */
const MUSIC_TIMEOUT = 3_000;

/** The latest scrobble on Last.fm, or null with no key, no scrobble or Last.fm down. */
export async function fetchLastFmTrack(event: H3Event): Promise<Track | null> {
  const config = useRuntimeConfig(event);
  if (!config.lastfmApiKey || !config.public.lastfmUsername)
    return null;

  try {
    const response = await $fetch<LastFmApiResponse>("https://ws.audioscrobbler.com/2.0/", {
      query: {
        method: "user.getrecenttracks",
        user: config.public.lastfmUsername,
        api_key: config.lastfmApiKey,
        format: "json",
        limit: 1
      },
      timeout: MUSIC_TIMEOUT
    });
    const tracks = response.recenttracks?.track;
    const track = Array.isArray(tracks) ? tracks[0] : tracks;
    if (!track || response.error)
      return null;

    const image = track.image?.find(item => item.size === "extralarge" && item["#text"])?.["#text"]
      ?? track.image?.find(item => item["#text"])?.["#text"]
      ?? null;

    return {
      title: track.name,
      artist: track.artist["#text"],
      album: track.album["#text"] || null,
      image,
      url: track.url,
      isNowPlaying: track["@attr"]?.nowplaying === "true",
      playedAt: track.date?.uts ? Number(track.date.uts) * 1000 : null,
      source: "lastfm"
    };
  } catch {
    return null;
  }
}

/**
 * An access token from the refresh token, cached for a little less than the hour Spotify gives it.
 * Spotify expires a refresh token six months after it was granted: from then on this returns null
 * and the cards fall back to Last.fm until `pnpm spotify:token` issues a new one.
 */
const getSpotifyAccessToken = defineCachedFunction(async (event: H3Event): Promise<string | null> => {
  const config = useRuntimeConfig(event);
  if (!config.spotifyClientId || !config.spotifyClientSecret || !config.spotifyRefreshToken)
    return null;

  try {
    const response = await $fetch<{ access_token: string }>("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "authorization": `Basic ${btoa(`${config.spotifyClientId}:${config.spotifyClientSecret}`)}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: config.spotifyRefreshToken }).toString(),
      timeout: MUSIC_TIMEOUT
    });
    return response.access_token;
  } catch {
    return null;
  }
}, {
  name: "spotify-access-token",
  maxAge: 50 * 60,
  getKey: () => "token",
  // A failed refresh is retried on the next request instead of being cached for the hour.
  validate: entry => !!entry.value
});

function toSpotifyTrack(track: SpotifyApiTrack, isNowPlaying: boolean, playedAt: number | null): Track {
  // Spotify lists covers largest first; 300px is plenty for a card and keeps the inlined image small.
  const image = track.album.images.find(item => item.width === 300)?.url ?? track.album.images[0]?.url ?? null;
  return {
    title: track.name,
    artist: track.artists.map(artist => artist.name).join(", "),
    album: track.album.name || null,
    image,
    url: track.external_urls.spotify,
    isNowPlaying,
    playedAt,
    source: "spotify"
  };
}

/** What is playing on Spotify, else the last track played there, or null when Spotify is not set up. */
export async function fetchSpotifyTrack(event: H3Event): Promise<Track | null> {
  const token = await getSpotifyAccessToken(event);
  if (!token)
    return null;

  const headers = { authorization: `Bearer ${token}` };
  try {
    // 204 with no body when nothing is playing; a podcast episode has no track to show.
    const current = await $fetch<SpotifyCurrentlyPlaying | undefined>("https://api.spotify.com/v1/me/player/currently-playing", {
      headers,
      timeout: MUSIC_TIMEOUT
    });
    if (current?.is_playing && current.currently_playing_type === "track" && current.item)
      return toSpotifyTrack(current.item, true, null);

    const recent = await $fetch<SpotifyRecentlyPlayed>("https://api.spotify.com/v1/me/player/recently-played", {
      headers,
      query: { limit: 1 },
      timeout: MUSIC_TIMEOUT
    });
    const last = recent.items[0];
    return last ? toSpotifyTrack(last.track, false, Date.parse(last.played_at)) : null;
  } catch {
    return null;
  }
}

/** Spotify when it is set up and answering, Last.fm otherwise. */
export async function fetchListening(event: H3Event): Promise<Track | null> {
  return await fetchSpotifyTrack(event) ?? await fetchLastFmTrack(event);
}

/** `fetchListening` for the README routes, cached briefly so a burst of card loads costs one lookup. */
export const fetchListeningCached = defineCachedFunction(fetchListening, {
  name: "listening",
  maxAge: 30,
  getKey: () => "track"
});
