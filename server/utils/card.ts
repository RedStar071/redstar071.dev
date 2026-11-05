import type { Node } from "takumi-js";
import type { CardIcon, CardShape } from "./card-shapes";
import { renderSvg } from "takumi-js";
import { container, googleFonts, image, text } from "takumi-js/helpers";
import { CARD_ICONS, CARD_SHAPES } from "./card-shapes";
import { escapeXml } from "./svg";

/**
 * The README cards, laid out as Takumi node trees and rendered to SVG.
 *
 * Takumi draws text as glyph outlines and inlines every shape, so a card needs nothing from
 * outside itself, which is all camo's `<img>` allows. It draws one palette per render: a card
 * that follows the reader's theme is rendered twice and `prefers-color-scheme` shows one.
 */

export type CardTheme = "auto" | "dark" | "light";

/**
 * The site's tokens (DESIGN.md): night surfaces layered card → row, the WolfStar ember red, and
 * tonal or solid shape badges. In light mode the card takes the page grey and rows go white, so
 * it still stands out on GitHub's white page.
 */
export const CARD_PALETTES = {
  dark: {
    card: "#151a20",
    row: "#232930",
    track: "#3a4149",
    text: "#e2e6eb",
    highlight: "#ffffff",
    muted: "#9ca3ac",
    primary: "#ff6467",
    solid: "#fb2c36",
    badge: { solid: "#fb2c36", tonal: "#460809" },
    badgeIcon: { solid: "#151a20", tonal: "#ffa2a2" }
  },
  light: {
    card: "#f1f4f7",
    row: "#ffffff",
    track: "#e2e6eb",
    text: "#3a4149",
    highlight: "#0a0e12",
    muted: "#4e555e",
    primary: "#c10007",
    solid: "#fb2c36",
    badge: { solid: "#c10007", tonal: "#ffe2e2" },
    badgeIcon: { solid: "#ffffff", tonal: "#c10007" }
  }
} as const;

export type CardPalette = (typeof CARD_PALETTES)[keyof typeof CARD_PALETTES];

/** Display numbers: Google Sans Flex at its heaviest with fully round terminals, like the hero name. */
export const ROUND = { fontFamily: "Google Sans Flex", fontWeight: 900 } as const;
/** Titles and labels, at the weight of the site's card titles. */
export const SANS = { fontFamily: "Google Sans Flex", fontWeight: 500 } as const;
/** Dates and small print, like the site's mono metadata. */
export const MONO = { fontFamily: "Google Sans Code", fontWeight: 400 } as const;

/**
 * The site's two families from Google Fonts, as `unicode-range` subsets a render only downloads
 * when its text needs them. Loaded once per isolate; a failure is retried on the next card.
 */
let fonts: ReturnType<typeof googleFonts> | undefined;
function loadFonts() {
  fonts ??= googleFonts([
    { name: "Google Sans Flex", weight: 900, axes: { ROND: 100 } },
    { name: "Google Sans Flex", weight: 500 },
    { name: "Google Sans Code", weight: 400 }
  ]).catch((error) => {
    fonts = undefined;
    throw error;
  });
  return fonts;
}

/** A standalone SVG as a data URI, for Takumi's image nodes. */
function svgImage(body: string, viewBox = "0 0 100 100") {
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`)}`;
}

function icon(src: string, size: number, style: Record<string, unknown> = {}) {
  return image({ src, width: size, height: size, style: { width: size, height: size, flexShrink: 0, ...style } });
}

/** The chubby sticker star from around the avatar, red-300 with a red-500 outline in both themes. */
export function stickerStar(size: number, style: Record<string, unknown> = {}) {
  return icon(svgImage(
    `<path d="${CARD_SHAPES.star}" fill="#ffa2a2" stroke="#fb2c36" stroke-width="7" stroke-linejoin="round"/>`
    + `<path d="${CARD_SHAPES.star}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 400" stroke-dashoffset="-2" transform="translate(50 46) scale(0.7) translate(-50 -46)"/>`,
    "-6 -4 112 108"
  ), size, style);
}

/** A Material 3 shape traced as a ring, `stroke` px wide at `size`. */
export function shapeRing(shape: CardShape, size: number, stroke: number, track: string, color: string) {
  const width = (stroke * 100) / size;
  const inset = width / 2;
  const scale = (100 - width) / 100;
  const path = `<path d="${CARD_SHAPES[shape]}" fill="none" stroke-width="${width}" transform="translate(${inset} ${inset}) scale(${scale})"`;
  return icon(svgImage(`${path} stroke="${track}"/>${path} stroke="${color}" stroke-linecap="round"/>`), size, {
    position: "absolute",
    top: 0,
    left: 0
  });
}

/** A Material 3 shape badge with an icon, like `ShapeBadge`. */
function shapeBadge(palette: CardPalette, shape: CardShape, glyph: CardIcon, tone: "solid" | "tonal", size = 40) {
  const iconScale = (100 * 0.55) / 24;
  const inset = (100 - 24 * iconScale) / 2;
  return icon(svgImage(
    `<path d="${CARD_SHAPES[shape]}" fill="${palette.badge[tone]}"/>`
    + `<path d="${CARD_ICONS[glyph]}" transform="translate(${inset} ${inset}) scale(${iconScale})" fill="${palette.badgeIcon[tone]}"/>`
  ), size);
}

/**
 * A list of rows like the site's `LinkRow` lists: `rounded-xs` rows 2px apart inside a
 * `rounded-lg` clip. `direction` lays them out side by side or stacked.
 */
export function rowList(palette: CardPalette, rows: Node[][], direction: "row" | "column", style: Record<string, unknown> = {}) {
  return container({
    style: { display: "flex", flexDirection: direction, gap: 2, borderRadius: 16, overflow: "hidden", ...style },
    children: rows.map(children => container({
      style: { display: "flex", flex: 1, backgroundColor: palette.row, borderRadius: 4 },
      children
    }))
  });
}

export interface CardHeader {
  /** Lowercase, like the site's card headings. */
  title: string;
  icon: CardIcon;
  shape: CardShape;
  tone?: "solid" | "tonal";
}

/** A bento card: shape badge, lowercase title and a sticker star, then the body. */
export function cardFrame(palette: CardPalette, header: CardHeader, body: Node[]) {
  return container({
    style: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      padding: "22px 24px 24px",
      backgroundColor: palette.card,
      borderRadius: 24,
      color: palette.text,
      ...SANS
    },
    children: [
      container({
        style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
        children: [
          shapeBadge(palette, header.shape, header.icon, header.tone ?? "tonal"),
          text(header.title, { flex: 1, fontSize: 22, color: palette.highlight, letterSpacing: "-0.02em" }),
          stickerStar(30)
        ]
      }),
      ...body
    ]
  });
}

/** A card for when there is nothing to draw, so the README shows a message rather than a broken image. */
export function messageCard(header: CardHeader, message: string) {
  return (palette: CardPalette) => cardFrame(palette, header, [
    rowList(palette, [[text(message, { padding: "10px 16px", fontSize: 14 })]], "column")
  ]);
}

/** Gives one render's ids a prefix, so two renders can share one document. */
function prefixIds(svg: string, prefix: string) {
  return svg
    .replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}$1"`);
}

/** The inside of an `<svg>` document. */
function svgBody(svg: string) {
  return svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
}

/**
 * Renders a card `width` px wide, as tall as its content, in the reader's theme: in `auto`, both
 * palettes go into one SVG and `prefers-color-scheme` (which follows GitHub's theme inside camo's
 * `<img>`) picks one. `label` is read out in place of the picture.
 */
export async function renderCard(build: (palette: CardPalette) => Node, width: number, theme: CardTheme, label: string) {
  const options = { width, fonts: await loadFonts() };
  const themes = theme === "auto" ? (["dark", "light"] as const) : [theme];
  const renders = await Promise.all(themes.map(name => renderSvg(build(CARD_PALETTES[name]), options)));
  const height = Number(renders[0]!.match(/\bheight="([\d.]+)"/)?.[1]) || 0;
  const bodies = renders.map((svg, index) => {
    const name = themes[index]!;
    return `<g class="${name}">${prefixIds(svgBody(svg), `${name[0]}-`)}</g>`;
  });

  const escaped = escapeXml(label);
  const styles = theme === "auto"
    ? `<style>.light { display: none; } @media (prefers-color-scheme: light) { .dark { display: none; } .light { display: inline; } }</style>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escaped}"><title>${escaped}</title>${styles}${bodies.join("")}</svg>`;
}
