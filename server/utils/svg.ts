import type { H3Event } from "h3";

/**
 * The README cards: plain SVG strings, drawn in the site's colours.
 *
 * GitHub proxies README images through camo and shows them in an `<img>`, so a card can load
 * nothing from outside itself: no web fonts, no remote images (covers are inlined as data URIs).
 * CSS and animations do work, and `prefers-color-scheme` follows the reader's GitHub theme.
 */

export type CardTheme = "auto" | "dark" | "light";

const PALETTE = {
  dark: { bg: "#0d1117", border: "#30363d", text: "#e6edf3", muted: "#8b949e", accent: "#fd171b", track: "#21262d" },
  light: { bg: "#ffffff", border: "#d0d7de", text: "#1f2328", muted: "#59636e", accent: "#d10f13", track: "#eaeef2" }
} as const;

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Cuts a line to a character budget: an `<img>` SVG cannot measure its text. */
export function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

/** `?theme=dark|light` pins a card's colours; anything else follows the reader's theme. */
export function getCardTheme(event: H3Event): CardTheme {
  const { theme } = getQuery(event);
  return theme === "dark" || theme === "light" ? theme : "auto";
}

function paletteVariables(palette: (typeof PALETTE)[keyof typeof PALETTE]) {
  return Object.entries(palette).map(([name, value]) => `--${name}: ${value};`).join(" ");
}

function themeStyles(theme: CardTheme) {
  if (theme !== "auto")
    return `svg { ${paletteVariables(PALETTE[theme])} }`;
  return [
    `svg { ${paletteVariables(PALETTE.light)} }`,
    `@media (prefers-color-scheme: dark) { svg { ${paletteVariables(PALETTE.dark)} } }`
  ].join("\n");
}

interface CardOptions {
  width: number;
  height: number;
  title: string;
  /** Short text read out in place of the picture. */
  label: string;
  theme: CardTheme;
  body: string;
  styles?: string;
}

export function renderCard({ width, height, title, label, theme, body, styles = "" }: CardOptions) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">
<title>${escapeXml(label)}</title>
<style>
${themeStyles(theme)}
text { font-family: ${FONT}; fill: var(--text); }
.title { font-size: 16px; font-weight: 600; fill: var(--accent); }
.muted { fill: var(--muted); }
.accent { fill: var(--accent); }
.fade { opacity: 0; animation: fade 0.5s ease-out forwards; }
@keyframes fade { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } .fade { opacity: 1; } }
${styles}
</style>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="var(--bg)" stroke="var(--border)" />
<text x="24" y="36" class="title">${escapeXml(title)}</text>
${body}
</svg>`;
}

/** A card for when there is nothing to draw, so the README shows a message rather than a broken image. */
export function renderMessageCard(title: string, message: string, theme: CardTheme) {
  return renderCard({
    width: 495,
    height: 90,
    title,
    label: `${title}: ${message}`,
    theme,
    body: `<text x="24" y="64" class="muted" font-size="14">${escapeXml(message)}</text>`
  });
}

/** Sends a card; `maxAge` is how long GitHub's image proxy and browsers may keep it. */
export function sendSvg(event: H3Event, svg: string, maxAge: number) {
  setResponseHeaders(event, {
    "content-type": "image/svg+xml; charset=utf-8",
    "cache-control": maxAge > 0
      ? `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}`
      : "no-cache, no-store, must-revalidate"
  });
  return svg;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk)
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

/** Downloads an image into a data URI, the only way it shows inside an `<img>` SVG. Null on failure. */
export async function inlineImage(url: string | null) {
  if (!url)
    return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/"))
      return null;
    return `data:${type};base64,${toBase64(new Uint8Array(await response.arrayBuffer()))}`;
  } catch {
    return null;
  }
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** 1234 → "1.2K", the way GitHub prints counts. */
export function formatCount(value: number) {
  return compact.format(value);
}

/** "3 min ago", "2 h ago", "4 days ago": coarse on purpose, since the proxy may hold a card a while. */
export function formatAgo(timestamp: number, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000));
  if (minutes < 1)
    return "just now";
  if (minutes < 60)
    return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24)
    return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
