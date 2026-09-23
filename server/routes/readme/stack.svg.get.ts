import { readFile } from "node:fs/promises";
import { queryCollection } from "@nuxt/content/server";

interface IconifySet {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number }>;
}

/**
 * The stack from `content/index.yml` as a row of Simple Icons, drawn in the card's text colour.
 *
 * Prerendered only (and served in dev): the icon set is read from disk at build time, so its few megabytes
 * never reach the Worker, and the stack only changes when the site is redeployed.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.prerender && !import.meta.dev)
    throw createError({ statusCode: 404 });

  const page = await queryCollection(event, "index").first();
  const items = page?.stack.items.filter(item => item.icon.startsWith("i-simple-icons-")) ?? [];

  const set: IconifySet = JSON.parse(await readFile("node_modules/@iconify-json/simple-icons/icons.json", "utf8"));

  const size = 40;
  const gap = 16;
  const perRow = 10;
  const tiles = items.map((item, index) => {
    const name = item.icon.replace("i-simple-icons-", "");
    const icon = set.icons[name];
    if (!icon)
      return "";
    const x = 24 + (index % perRow) * (size + gap);
    const y = 54 + Math.floor(index / perRow) * (size + gap);
    const viewBox = `0 0 ${icon.width ?? set.width ?? 24} ${icon.height ?? set.height ?? 24}`;
    return `<g class="fade" style="animation-delay: ${index * 60}ms">
  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="10" fill="var(--track)" />
  <svg x="${x + 9}" y="${y + 9}" width="${size - 18}" height="${size - 18}" viewBox="${viewBox}" style="color: var(--text)"><title>${escapeXml(item.label)}</title>${icon.body}</svg>
</g>`;
  }).join("\n");

  const rows = Math.max(1, Math.ceil(items.length / perRow));
  setResponseHeader(event, "content-type", "image/svg+xml; charset=utf-8");
  return renderCard({
    width: 24 * 2 + perRow * size + (perRow - 1) * gap,
    height: 54 + rows * size + (rows - 1) * gap + 24,
    title: page?.stack.title ?? "what i use",
    label: `What I use: ${items.map(item => item.label).join(", ")}`,
    theme: getCardTheme(event),
    body: tiles
  });
});
