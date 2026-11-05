import type { H3Event } from "h3";
import type { CardTheme } from "./card";

/**
 * Serving the README cards (drawn in `card.ts`): GitHub proxies README images through camo,
 * which shows them in an `<img>` and gives up on one that takes more than a few seconds.
 */

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** `?theme=dark|light` pins a card's colours; anything else follows the reader's theme. */
export function getCardTheme(event: H3Event): CardTheme {
  const { theme } = getQuery(event);
  return theme === "dark" || theme === "light" ? theme : "auto";
}

/** A drawn card, and how long GitHub's image proxy and browsers may keep it. */
export interface DrawnCard {
  svg: string;
  maxAge: number;
}

/**
 * Camo shows an image that takes more than a few seconds as broken. A cold card needs GitHub
 * GraphQL calls that can take about that long, so past this the route answers with a placeholder
 * (itself a quick render) and finishes drawing in the background.
 */
const CARD_DEADLINE = 2_000;
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
/** Placeholders already drawn in this isolate: they only change with the card and its theme. */
const placeholders = new Map<string, Promise<string>>();

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
  placeholder: (pending: boolean) => Promise<string>
) {
  const cache = edgeCache();
  const url = getRequestURL(event);
  const keyUrl = new URL(url.pathname, url.origin);
  for (const [name, value] of Object.entries(variant).sort(([a], [b]) => a.localeCompare(b)))
    keyUrl.searchParams.set(name, String(value));
  const key = keyUrl.toString();

  const drawPlaceholder = (pending: boolean) => {
    const id = `${key}#${pending}`;
    let svg = placeholders.get(id);
    if (!svg) {
      svg = placeholder(pending);
      placeholders.set(id, svg);
      svg.catch(() => placeholders.delete(id));
    }
    return svg;
  };

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
    return card ? sendSvg(event, card.svg, card.maxAge) : sendSvg(event, await drawPlaceholder(false), 300);
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
    return sendSvg(event, await drawPlaceholder(true), 60);
  }
  if (!card)
    return sendSvg(event, await drawPlaceholder(false), 300);
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
