import { defineCachedHandler } from "nitro/cache";

/** A deliberately small public response; the Last.fm API key never reaches the browser. */
export default defineCachedHandler(async () => {
  // Presence is optional: with no key, no scrobble or Last.fm down this is null, never an error.
  const track = await fetchLastFmTrack();
  if (!track)
    return null;

  const { source, ...response } = track;
  return response;
}, { maxAge: 60, swr: true });
