import type { CardPalette } from "../../utils/card";
import { container, text } from "takumi-js/helpers";
import { cardFrame, messageCard, MONO, renderCard, rowList } from "../../utils/card";

/** How much of each language is in the public repositories, as a bento card from the site. */

const HEADER = { title: "what i write in", icon: "code", shape: "sunny", tone: "tonal" } as const;
const WIDTH = 495;
const BAR_WIDTH = WIDTH - 48;
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
      percent: `${((language.size / total) * 100).toFixed(1)}%`,
      share: language.size / total
    }));

    // One stacked pill, its segments 2px apart like the rows below; the rest of the languages make
    // up the track at the end. Every segment gets MIN_SEGMENT first, so tiny ones still show.
    const shown = languages.reduce((sum, language) => sum + language.share, 0);
    const gaps = GAP * (languages.length - (shown < 0.999 ? 0 : 1));
    const spread = Math.max(BAR_WIDTH - gaps - MIN_SEGMENT * languages.length, 0);

    // The legend as two columns of rows, filled top to bottom.
    const rows = Math.ceil(languages.length / 2);
    const legendRow = (palette: CardPalette, language: (typeof languages)[number]) => [container({
      style: { display: "flex", alignItems: "center", flex: 1, height: ROW_HEIGHT, padding: "0 14px 0 12px", gap: 9 },
      children: [
        container({ style: { width: 10, height: 10, borderRadius: 5, backgroundColor: language.color, flexShrink: 0 } }),
        text(language.name, { flex: 1, fontSize: 14, color: palette.highlight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
        text(language.percent, { ...MONO, fontSize: 12, color: palette.muted })
      ]
    })];

    const build = (palette: CardPalette) => cardFrame(palette, HEADER, [
      container({
        style: { display: "flex", gap: GAP, width: BAR_WIDTH, height: 12, borderRadius: 6, overflow: "hidden", backgroundColor: palette.row },
        children: languages.map(language => container({
          style: { width: MIN_SEGMENT + language.share * spread, height: 12, borderRadius: 2, backgroundColor: language.color, flexShrink: 0 }
        }))
      }),
      container({
        style: { display: "flex", gap: GAP, marginTop: 16 },
        children: [languages.slice(0, rows), languages.slice(rows)].filter(column => column.length).map(column =>
          rowList(palette, column.map(language => legendRow(palette, language)), "column", { flex: 1 }))
      })
    ]);

    return {
      svg: await renderCard(build, WIDTH, theme, `Most used languages: ${languages.map(language => `${language.name} ${language.percent}`).join(", ")}`),
      maxAge: 60 * 60
    };
  }, async (pending) => {
    const message = pending ? "counting the bytes, back in a minute" : "languages are taking a nap, back soon";
    return renderCard(messageCard(HEADER, message), WIDTH, theme, `${HEADER.title}: ${message}`);
  });
});
