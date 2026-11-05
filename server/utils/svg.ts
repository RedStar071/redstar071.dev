import type { H3Event } from "h3";
import type { CardIcon, CardShape } from "./card-shapes";
import { FALLBACK_STACKS, MONO_FACE, ROUND_FACE, SANS_FACE } from "./card-fonts";
import { CARD_ICONS, CARD_SHAPES } from "./card-shapes";

/**
 * The README cards: plain SVG strings, drawn like the site's bento cards.
 *
 * GitHub proxies README images through camo and shows them in an `<img>`, so a card can load
 * nothing from outside itself: fonts come inlined (see `card-fonts.ts`). CSS and animations do
 * work, and `prefers-color-scheme` follows the reader's GitHub theme.
 */

export type CardTheme = "auto" | "dark" | "light";

/**
 * The site's tokens (DESIGN.md): night surfaces layered card → row, the WolfStar ember red, and
 * tonal or solid shape badges. In light mode the card takes the page grey and rows go white, so
 * the card still stands out on GitHub's white page.
 */
const PALETTE = {
  dark: {
    "card": "#151a20",
    "row": "#232930",
    "track": "#3a4149",
    "text": "#e2e6eb",
    "highlight": "#ffffff",
    "muted": "#9ca3ac",
    "primary": "#ff6467",
    "solid": "#fb2c36",
    "badge-solid": "#fb2c36",
    "badge-solid-icon": "#151a20",
    "badge-tonal": "#460809",
    "badge-tonal-icon": "#ffa2a2"
  },
  light: {
    "card": "#f1f4f7",
    "row": "#ffffff",
    "track": "#e2e6eb",
    "text": "#3a4149",
    "highlight": "#0a0e12",
    "muted": "#4e555e",
    "primary": "#c10007",
    "solid": "#fb2c36",
    "badge-solid": "#c10007",
    "badge-solid-icon": "#ffffff",
    "badge-tonal": "#ffe2e2",
    "badge-tonal-icon": "#c10007"
  }
} as const;

/** The sticker star's colours, the same in both themes: red-300 fill, red-500 outline. */
const STICKER = { fill: "#ffa2a2", stroke: "#fb2c36" } as const;

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
    `svg { ${paletteVariables(PALETTE.dark)} }`,
    `@media (prefers-color-scheme: light) { svg { ${paletteVariables(PALETTE.light)} } }`
  ].join("\n");
}

/** The chubby sticker star from around the avatar, `size` px wide, twinkling slowly. */
export function stickerStar(x: number, y: number, size: number, delay = 0) {
  const scale = size / 100;
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="twinkle" style="animation-delay: ${delay}ms">
  <path d="${CARD_SHAPES.star}" fill="${STICKER.fill}" stroke="${STICKER.stroke}" stroke-width="7" stroke-linejoin="round" />
  <path d="${CARD_SHAPES.star}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 400" stroke-dashoffset="-2" transform="translate(50 46) scale(0.7) translate(-50 -46)" />
</g></g>`;
}

/** A Material 3 shape badge with an icon, like `ShapeBadge`: `size` px, solid or tonal. */
function shapeBadge(x: number, y: number, size: number, shape: CardShape, icon: CardIcon, tone: "solid" | "tonal") {
  const iconSize = size * 0.55;
  const inset = (size - iconSize) / 2;
  return `<g transform="translate(${x} ${y})">
  <path d="${CARD_SHAPES[shape]}" transform="scale(${size / 100})" fill="var(--badge-${tone})" />
  <path d="${CARD_ICONS[icon]}" transform="translate(${inset} ${inset}) scale(${iconSize / 24})" fill="var(--badge-${tone}-icon)" />
</g>`;
}

/**
 * A list of rows like the site's `LinkRow` lists: `rounded-xs` rows with 2px gaps inside a
 * `rounded-lg` clip. `rows` are the rectangles' boxes; their contents are drawn by the caller.
 */
export function rowList(id: string, rows: Array<{ x: number; y: number; width: number; height: number }>) {
  const left = Math.min(...rows.map(row => row.x));
  const top = Math.min(...rows.map(row => row.y));
  const right = Math.max(...rows.map(row => row.x + row.width));
  const bottom = Math.max(...rows.map(row => row.y + row.height));
  return `<clipPath id="${id}"><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="16" /></clipPath>
<g clip-path="url(#${id})">${rows.map(row => `<rect x="${row.x}" y="${row.y}" width="${row.width}" height="${row.height}" rx="4" fill="var(--row)" />`).join("")}</g>`;
}

interface CardOptions {
  width: number;
  height: number;
  /** Lowercase, like the site's card headings. */
  title: string;
  /** Short text read out in place of the picture. */
  label: string;
  theme: CardTheme;
  icon: CardIcon;
  shape: CardShape;
  tone?: "solid" | "tonal";
  body: string;
  /** `@font-face` rules from `embedFonts`. */
  fonts?: string;
  styles?: string;
}

export function renderCard({ width, height, title, label, theme, icon, shape, tone = "tonal", body, fonts = "", styles = "" }: CardOptions) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">
<title>${escapeXml(label)}</title>
<style>
${fonts}
${themeStyles(theme)}
text { fill: var(--text); }
.round { font-family: "${ROUND_FACE.family}", ${FALLBACK_STACKS[ROUND_FACE.family]}; font-weight: 900; fill: var(--highlight); }
.sans { font-family: "${SANS_FACE.family}", ${FALLBACK_STACKS[SANS_FACE.family]}; font-weight: 500; }
.mono { font-family: "${MONO_FACE.family}", ${FALLBACK_STACKS[MONO_FACE.family]}; fill: var(--muted); }
.title { font-size: 22px; fill: var(--highlight); letter-spacing: -0.02em; }
.highlight { fill: var(--highlight); }
.primary { fill: var(--primary); }
.muted { fill: var(--muted); }
.rise { animation: rise 0.7s cubic-bezier(0.38, 1.21, 0.22, 1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } }
.twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 4.8s ease-in-out infinite; }
@keyframes twinkle { 0%, 100% { transform: scale(1) rotate(0deg); } 45% { transform: scale(0.72) rotate(-14deg); } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
${styles}
</style>
<rect width="${width}" height="${height}" rx="24" fill="var(--card)" />
${shapeBadge(24, 22, 40, shape, icon, tone)}
<text x="76" y="50" class="sans title">${escapeXml(title)}</text>
${stickerStar(width - 54, 16, 30)}
${body}
</svg>`;
}

/** A card for when there is nothing to draw, so the README shows a message rather than a broken image. */
export function renderMessageCard(card: { title: string; icon: CardIcon; shape: CardShape; tone?: "solid" | "tonal" }, message: string, theme: CardTheme) {
  const width = 495;
  return renderCard({
    ...card,
    width,
    height: 134,
    label: `${card.title}: ${message}`,
    theme,
    body: `${rowList("message", [{ x: 24, y: 76, width: width - 48, height: 38 }])}
<text x="40" y="100" class="sans" font-size="14">${escapeXml(message)}</text>`
  });
}

/** A drawn card, and how long GitHub's image proxy and browsers may keep it. */
export interface DrawnCard {
  svg: string;
  maxAge: number;
}

/**
 * GitHub's image proxy (camo) gives up on an image after a few seconds and shows it broken.
 * A cold card needs one GitHub GraphQL call that can take about that long, so past this the
 * route answers with a placeholder and finishes drawing in the background.
 */
const CARD_DEADLINE = 2_500;
/** How long the edge keeps a drawn card: past its `maxAge` it is still served while a new one is drawn. */
const EDGE_TTL = 60 * 60 * 24 * 7;
const DRAWN_AT = "x-card-drawn-at";
const MAX_AGE = "x-card-max-age";

/**
 * Cloudflare's cache for the data centre, shared by every Worker isolate in it. The in-memory
 * cache of `defineCachedFunction` lives in one isolate only, so on its own nearly every request
 * from camo landed on a cold one. Undefined outside Cloudflare (`nuxt dev`).
 */
function edgeCache(): Cache | undefined {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default;
}

/** Draws in progress in this isolate, by cache key, so concurrent requests share one. */
const drawing = new Map<string, Promise<DrawnCard | null>>();

/**
 * Serves a README card fast enough for camo: from the edge cache when it can (redrawing in the
 * background once it is older than its `maxAge`), else drawn now, else a placeholder in time.
 * `draw` returns null when there is nothing to draw; `placeholder` then fills in. `variant` holds
 * the query values the route reads: they, and nothing else in the URL, pick the cache entry.
 */
export async function serveCard(
  event: H3Event,
  variant: Record<string, string | number>,
  draw: () => Promise<DrawnCard | null>,
  placeholder: (pending: boolean) => string
) {
  const cache = edgeCache();
  const url = getRequestURL(event);
  const keyUrl = new URL(url.pathname, url.origin);
  for (const [name, value] of Object.entries(variant).sort(([a], [b]) => a.localeCompare(b)))
    keyUrl.searchParams.set(name, String(value));
  const key = keyUrl.toString();

  const redraw = () => {
    const pending = drawing.get(key);
    if (pending)
      return pending;
    const next = (async () => {
      const card = await draw().catch(() => null);
      if (card && cache) {
        await cache.put(new Request(key), new Response(card.svg, {
          headers: {
            "content-type": "image/svg+xml; charset=utf-8",
            "cache-control": `public, max-age=${EDGE_TTL}`,
            [DRAWN_AT]: String(Date.now()),
            [MAX_AGE]: String(card.maxAge)
          }
        })).catch(() => {});
      }
      return card;
    })().finally(() => drawing.delete(key));
    drawing.set(key, next);
    return next;
  };

  // Outside Cloudflare there is nowhere to keep a card for the next request: just draw it.
  if (!cache) {
    const card = await redraw();
    return card ? sendSvg(event, card.svg, card.maxAge) : sendSvg(event, placeholder(false), 300);
  }

  const hit = await cache.match(new Request(key)).catch(() => undefined);
  if (hit) {
    const maxAge = Number(hit.headers.get(MAX_AGE)) || 60 * 60;
    if (Date.now() - Number(hit.headers.get(DRAWN_AT)) > maxAge * 1000)
      event.waitUntil(redraw());
    return sendSvg(event, await hit.text(), maxAge);
  }

  const current = redraw();
  const card = await Promise.race([
    current,
    new Promise<undefined>(resolve => setTimeout(resolve, CARD_DEADLINE, undefined))
  ]);
  if (card === undefined) {
    // Still drawing: keep going after the response, so the next request finds it cached.
    event.waitUntil(current);
    return sendSvg(event, placeholder(true), 60);
  }
  if (!card)
    return sendSvg(event, placeholder(false), 300);
  return sendSvg(event, card.svg, card.maxAge);
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

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** 1234 → "1.2K", the way GitHub prints counts. */
export function formatCount(value: number) {
  return compact.format(value);
}
