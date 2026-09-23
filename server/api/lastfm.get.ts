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

/** A deliberately small public response; the Last.fm API key never reaches the browser. */
export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig();
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
      // The card is rendered on the server: a slow Last.fm must not hold up the page.
      timeout: 3_000
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
      playedAt: track.date?.uts ? Number(track.date.uts) * 1000 : null
    };
  } catch {
    // Presence is optional: a Last.fm outage should never make the page fail.
    return null;
  }
}, { maxAge: 60, swr: true });
