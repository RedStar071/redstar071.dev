/**
 * The site's typefaces, inlined into a README card.
 *
 * Camo shows a card in an `<img>`, which loads nothing from outside the SVG, but an `@font-face`
 * with a data URI works. Google Fonts' `text=` parameter cuts each face down to the characters
 * the card actually draws, so the three faces together weigh a few kilobytes.
 */

export interface CardFace {
  /** The `font-family` the card's CSS uses. */
  family: string;
  /** The Google Fonts css2 `family=` value, axes and all. */
  query: string;
  /** Every string drawn in this face. */
  text: string[];
}

/** Display numbers: Google Sans Flex at its heaviest with fully round terminals, like the hero name. */
export const ROUND_FACE = { family: "card-round", query: "Google Sans Flex:wght,ROND@900,100" } as const;
/** Titles and labels, at the weight of the site's card titles. */
export const SANS_FACE = { family: "card-sans", query: "Google Sans Flex:wght@500" } as const;
/** Dates and small print, like the site's mono metadata. */
export const MONO_FACE = { family: "card-mono", query: "Google Sans Code:wght@400" } as const;

/** What each family falls back to when the font cannot be fetched. */
export const FALLBACK_STACKS: Record<string, string> = {
  [ROUND_FACE.family]: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
  [SANS_FACE.family]: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
  [MONO_FACE.family]: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
};

// Google Fonts sends WOFF2 only to browsers it recognises.
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const FONT_TIMEOUT = 2_000;

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk)
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

async function fetchFace(face: CardFace) {
  const characters = [...new Set(face.text.join(""))].sort().join("");
  if (!characters)
    return null;

  const css = await $fetch<string>("https://fonts.googleapis.com/css2", {
    query: { family: face.query, text: characters },
    headers: { "user-agent": BROWSER_UA },
    responseType: "text",
    timeout: FONT_TIMEOUT
  });
  const url = css.match(/url\((https:[^)]+)\)\s*format\('woff2'\)/)?.[1];
  if (!url)
    return null;

  const font = await $fetch<ArrayBuffer>(url, { responseType: "arrayBuffer", timeout: FONT_TIMEOUT });
  return `@font-face { font-family: "${face.family}"; src: url(data:font/woff2;base64,${toBase64(new Uint8Array(font))}) format("woff2"); }`;
}

/**
 * `@font-face` rules for every face, plus whether all of them arrived. A face that fails is left
 * out and its text falls back to the system stack; the caller caches such a card for less time.
 */
export async function embedFonts(faces: CardFace[]) {
  const rules = await Promise.all(faces.map(face => fetchFace(face).catch(() => null)));
  return {
    css: rules.filter(Boolean).join("\n"),
    complete: rules.every(Boolean)
  };
}
