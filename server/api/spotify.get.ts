/** A deliberately small public response; the Spotify credentials never reach the browser. */
export default defineCachedEventHandler(async (event) => {
  // Optional like the Last.fm card: with no credentials or Spotify down this is an empty list, never an error.
  return await fetchSpotifyRecent(event, 5);
}, { maxAge: 30, swr: true });
