export type DiscordStatus = "online" | "idle" | "dnd" | "offline";

export interface LanyardActivity {
  id: string;
  name: string;
  /** 0 playing, 1 streaming, 2 listening, 3 watching, 4 custom status, 5 competing */
  type: 0 | 1 | 2 | 3 | 4 | 5;
  state?: string;
  details?: string;
  application_id?: string;
  emoji?: { name: string; id?: string; animated?: boolean };
  timestamps?: { start?: number; end?: number };
  assets?: { large_image?: string; large_text?: string };
}

export interface LanyardPresence {
  discord_status: DiscordStatus;
  discord_user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
  };
  activities: LanyardActivity[];
  active_on_discord_desktop: boolean;
  active_on_discord_mobile: boolean;
  active_on_discord_web: boolean;
  listening_to_spotify: boolean;
  spotify: {
    track_id: string | null;
    song: string;
    artist: string;
    album: string;
    album_art_url: string | null;
    timestamps: { start: number; end: number };
  } | null;
}

interface LanyardResponse {
  success: boolean;
  data: LanyardPresence;
}

export const statusLabels: Record<DiscordStatus, string> = {
  online: "online",
  idle: "idle",
  dnd: "do not disturb",
  offline: "offline"
};

export const statusColors: Record<DiscordStatus, string> = {
  online: "bg-success",
  idle: "bg-warning",
  dnd: "bg-error",
  offline: "bg-neutral-500"
};

/** Resolves a Rich Presence asset key to an image URL, following Discord's asset prefixes. */
export function activityImage(activity: LanyardActivity) {
  const key = activity.assets?.large_image;
  if (!key)
    return null;
  if (key.startsWith("mp:"))
    return `https://media.discordapp.net/${key.slice(3)}`;
  if (key.startsWith("spotify:"))
    return `https://i.scdn.co/image/${key.slice(8)}`;
  if (!activity.application_id)
    return null;
  return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${key}.png`;
}

/**
 * Live Discord presence from Lanyard (https://github.com/Phineas/lanyard).
 * Client-only: the page is prerendered, so presence is fetched after hydration.
 * Every caller shares one request through the fixed key.
 */
export function useDiscordPresence() {
  const { global } = useAppConfig();

  return useLazyFetch(`https://api.lanyard.rest/v1/users/${global.discordId}`, {
    key: "discord-presence",
    server: false,
    transform: (response: LanyardResponse) => response.data
  });
}
