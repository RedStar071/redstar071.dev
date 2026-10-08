import type { H3Event } from "h3";

/** One track, as Last.fm reports it. */
export interface Track {
  title: string;
  artist: string;
  album: string | null;
  image: string | null;
  url: string;
  isNowPlaying: boolean;
  playedAt: number | null;
  source: "lastfm";
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

/** Past this, Last.fm is down as far as the widget is concerned. */
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

/** One entry of the recently played list. */
export interface SpotifyTrack {
  title: string;
  artist: string;
  album: string | null;
  image: string | null;
  url: string;
  isNowPlaying: boolean;
  playedAt: number | null;
}

/**
 * An access token from the refresh token, cached for a little less than the hour Spotify gives it.
 * Spotify expires a refresh token six months after it was granted: from then on this returns null
 * until `pnpm spotify:token` issues a new one.
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

function toSpotifyTrack(track: SpotifyApiTrack, isNowPlaying: boolean, playedAt: number | null): SpotifyTrack {
  // Spotify lists covers largest first; 64px is the smallest, plenty for a list row.
  const image = track.album.images.at(-1)?.url ?? null;
  return {
    title: track.name,
    artist: track.artists.map(artist => artist.name).join(", "),
    album: track.album.name || null,
    image,
    url: track.external_urls.spotify,
    isNowPlaying,
    playedAt
  };
}

/** The track playing now, if any, followed by the latest ones played; empty when Spotify is not set up or down. */
export async function fetchSpotifyRecent(event: H3Event, limit = 5): Promise<SpotifyTrack[]> {
  const token = await getSpotifyAccessToken(event);
  if (!token)
    return [];

  const headers = { authorization: `Bearer ${token}` };
  try {
    // 204 with no body when nothing is playing; a podcast episode has no track to show.
    const [current, recent] = await Promise.all([
      $fetch<SpotifyCurrentlyPlaying | undefined>("https://api.spotify.com/v1/me/player/currently-playing", { headers, timeout: MUSIC_TIMEOUT }),
      $fetch<SpotifyRecentlyPlayed>("https://api.spotify.com/v1/me/player/recently-played", { headers, query: { limit }, timeout: MUSIC_TIMEOUT })
    ]);

    const tracks = recent.items.map(item => toSpotifyTrack(item.track, false, Date.parse(item.played_at)));
    if (current?.is_playing && current.currently_playing_type === "track" && current.item) {
      // The track playing now is often also the latest history entry: show it once, on top.
      const nowPlaying = toSpotifyTrack(current.item, true, null);
      return [nowPlaying, ...tracks.filter(track => track.url !== nowPlaying.url)].slice(0, limit);
    }
    return tracks;
  } catch {
    return [];
  }
}
