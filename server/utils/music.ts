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
