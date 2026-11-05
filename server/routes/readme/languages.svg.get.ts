import { embedFonts, MONO_FACE, SANS_FACE } from "../../utils/card-fonts";

/** How much of each language is in the public repositories, as a bento card from the site. */

const CARD = { title: "what i write in", icon: "code", shape: "sunny", tone: "tonal" } as const;

const WIDTH = 495;
const BAR_Y = 80;
const LIST_Y = 108;
const ROW_HEIGHT = 34;
const GAP = 2;
const MIN_SEGMENT = 2;

export default defineEventHandler((event) => {
  const theme = getCardTheme(event);
  const count = Math.min(Math.max(Number(getQuery(event).count) || 6, 2), 10);

  return serveCard(event, { theme, count }, async () => {
    const stats = await fetchGitHubStats(event);
    if (!stats?.languages.length)
      return null;

    const total = stats.languages.reduce((sum, language) => sum + language.size, 0);
    if (total <= 0)
      return null;
    const languages = stats.languages.slice(0, count).map(language => ({
      ...language,
      name: truncate(language.name, 18),
      percent: `${((language.size / total) * 100).toFixed(1)}%`,
      share: language.size / total
    }));

    const fonts = await embedFonts([
      { ...SANS_FACE, text: [CARD.title, ...languages.map(language => language.name)] },
      { ...MONO_FACE, text: languages.map(language => language.percent) }
    ]);

    // One stacked pill, its segments 2px apart like the rows below; the rest of the languages
    // make up the track at the end. Every segment gets at least MIN_SEGMENT, reserved up front
    // so the tiny ones still fit inside the pill.
    const barWidth = WIDTH - 48;
    const shown = languages.reduce((sum, language) => sum + language.share, 0);
    const gaps = GAP * (languages.length - (shown < 0.999 ? 0 : 1));
    const spread = Math.max(barWidth - gaps - MIN_SEGMENT * languages.length, 0);
    let offset = 24;
    const segments = languages.map((language, index) => {
      const width = MIN_SEGMENT + language.share * spread;
      const segment = `<rect x="${offset.toFixed(2)}" y="${BAR_Y}" width="${width.toFixed(2)}" height="12" rx="2" fill="${escapeXml(language.color)}" class="grow" style="animation-delay: ${index * 70}ms" />`;
      offset += width + GAP;
      return segment;
    }).join("");

    // The legend as two columns of rows, filled top to bottom.
    const rows = Math.ceil(languages.length / 2);
    const columnWidth = (barWidth - GAP) / 2;
    const boxes = languages.map((_, index) => ({
      x: 24 + (index < rows ? 0 : columnWidth + GAP),
      y: LIST_Y + (index % rows) * (ROW_HEIGHT + GAP),
      width: columnWidth,
      height: ROW_HEIGHT
    }));
    const legend = languages.map((language, index) => {
      const box = boxes[index]!;
      const baseline = box.y + ROW_HEIGHT / 2 + 5;
      return `<g class="rise" style="animation-delay: ${80 + index * 60}ms">
  <circle cx="${box.x + 16}" cy="${box.y + ROW_HEIGHT / 2}" r="5" fill="${escapeXml(language.color)}" />
  <text x="${box.x + 30}" y="${baseline}" class="sans highlight" font-size="14">${escapeXml(language.name)}</text>
  <text x="${box.x + box.width - 14}" y="${baseline}" class="mono" font-size="12" text-anchor="end">${escapeXml(language.percent)}</text>
</g>`;
    }).join("\n");

    const body = `<clipPath id="bar"><rect x="24" y="${BAR_Y}" width="${barWidth}" height="12" rx="6" /></clipPath>
<rect x="24" y="${BAR_Y}" width="${barWidth}" height="12" rx="6" fill="var(--row)" />
<g clip-path="url(#bar)">${segments}</g>
${rowList("legend", boxes)}
${legend}`;

    return {
      svg: renderCard({
        ...CARD,
        width: WIDTH,
        height: LIST_Y + rows * (ROW_HEIGHT + GAP) - GAP + 24,
        label: `Most used languages: ${languages.map(language => `${language.name} ${language.percent}`).join(", ")}`,
        theme,
        fonts: fonts.css,
        styles: `.grow { transform-box: fill-box; transform-origin: left; animation: grow 0.9s cubic-bezier(0.38, 1.21, 0.22, 1) both; }
@keyframes grow { from { transform: scaleX(0); } }`,
        body
      }),
      maxAge: fonts.complete ? 60 * 60 : 5 * 60
    };
  }, pending => renderMessageCard(CARD, pending ? "counting the bytes, back in a minute" : "languages are taking a nap, back soon", theme));
});
