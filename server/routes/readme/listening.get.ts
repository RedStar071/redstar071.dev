/** Sends a README reader from the listening card to the track it shows, on Spotify or Last.fm. */
export default defineEventHandler(async (event) => {
  const track = await fetchListeningCached(event);
  const config = useRuntimeConfig(event);
  setResponseHeader(event, "cache-control", "no-cache, no-store, must-revalidate");
  return sendRedirect(event, track?.url ?? `https://www.last.fm/user/${encodeURIComponent(config.public.lastfmUsername)}`, 302);
});
