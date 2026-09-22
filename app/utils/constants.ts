/**
 * Values shared across the site, or magic enough to deserve a name.
 *
 * Like the rest of `app/utils`, everything here is auto-imported.
 */

/** Wolf Ember red (#FD171B), the brand accent, as the integer Discord wants for a card's accent bar. */
export const BRAND_ACCENT_COLOR = 0xFD171B;

/** Discord reads a component embed only from a script carrying this id, and only one per page. */
export const COMPONENT_EMBED_SCRIPT_ID = "discord:component-embed";

/** Discord fits at most five buttons in an action row. */
export const MAX_EMBED_BUTTONS = 5;

/** Keeps a card a preview rather than a page: enough rows to be useful, few enough to skim. */
export const MAX_EMBED_LIST_ITEMS = 5;

/** Lanyard serves the presence Discord publishes for a user. @see https://github.com/Phineas/lanyard */
export const LANYARD_USERS_API = "https://api.lanyard.rest/v1/users";

/** How often the presence card refetches while the tab is visible. */
export const PRESENCE_REFRESH_INTERVAL = 30_000;

/** Discord's CDN: avatars, and the assets an app uploads for Rich Presence. */
export const DISCORD_CDN = "https://cdn.discordapp.com";

/** Discord's media proxy, where a Rich Presence asset key prefixed `mp:` points. */
export const DISCORD_MEDIA_PROXY = "https://media.discordapp.net";

/** The avatar Discord shows for an account that has never set one. */
export const DISCORD_DEFAULT_AVATAR = `${DISCORD_CDN}/embed/avatars/0.png`;

/** Spotify's cover art host, where a Rich Presence asset key prefixed `spotify:` points. */
export const SPOTIFY_IMAGE_CDN = "https://i.scdn.co/image";

/** Spotify on the web, for when a track has no id to link to. */
export const SPOTIFY_URL = "https://open.spotify.com";
