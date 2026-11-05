import type { Node } from "takumi-js";
import type { CardPalette } from "../../utils/card";
import type { Streak } from "../../utils/github";
import { container, text } from "takumi-js/helpers";
import { cardFrame, messageCard, MONO, renderCard, ROUND, rowList, shapeRing, stickerStar } from "../../utils/card";

/**
 * The GitHub card: contributions and streaks in the spirit of github-readme-streak-stats, drawn
 * like a bento card from the site. The current streak sits in a cookie ring with a sticker star
 * where the original has its flame; the profile numbers run along the bottom in mono.
 */

const HEADER = { title: "my github streak", icon: "fire", shape: "cookie", tone: "solid" } as const;
const WIDTH = 495;
const RING = 76;

const grouped = new Intl.NumberFormat("en");
const monthDay = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const monthDayYear = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "Sep 26", with the year only when it is not this one. */
function formatDay(date: string, thisYear: number) {
  const day = new Date(`${date}T00:00:00Z`);
  return (day.getUTCFullYear() === thisYear ? monthDay : monthDayYear).format(day);
}

function formatRange(streak: Streak, thisYear: number) {
  return streak.start === streak.end
    ? formatDay(streak.start, thisYear)
    : `${formatDay(streak.start, thisYear)} – ${formatDay(streak.end, thisYear)}`;
}

/** One column: a `RING`-tall figure, its label and its dates, so all three line up. */
function column(palette: CardPalette, figure: Node, label: string, range: string, accent = false) {
  return [container({
    style: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "20px 8px 16px" },
    children: [
      container({
        style: { display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: RING, height: RING },
        children: [figure]
      }),
      text(label, { marginTop: 18, fontSize: 14, color: accent ? palette.primary : palette.text }),
      text(range, { ...MONO, marginTop: 8, fontSize: 11, color: palette.muted })
    ]
  })];
}

export default defineEventHandler((event) => {
  const theme = getCardTheme(event);

  return serveCard(event, { theme }, async () => {
    const [stats, streak] = await Promise.all([fetchGitHubStats(event), fetchGitHubStreak(event)]);
    if (!stats || !streak)
      return null;

    const thisYear = new Date().getUTCFullYear();
    const total = grouped.format(streak.total);
    const current = grouped.format(streak.current.length);
    const longest = grouped.format(streak.longest.length);
    const since = streak.firstDay ? `${formatDay(streak.firstDay, thisYear)} – now` : "no contributions yet";
    const currentRange = streak.current.length ? formatRange(streak.current, thisYear) : "starts today";
    const longestRange = streak.longest.length ? formatRange(streak.longest, thisYear) : "starts today";
    const footer = `${formatCount(stats.stars)} stars · ${formatCount(stats.pullRequests)} pull requests · ${formatCount(stats.issues)} issues · ${formatCount(stats.followers)} followers`;

    const build = (palette: CardPalette) => cardFrame(palette, HEADER, [
      rowList(palette, [
        column(palette, text(total, { ...ROUND, fontSize: 34, color: palette.highlight }), "total contributions", since),
        column(palette, container({
          style: { display: "flex", alignItems: "center", justifyContent: "center", width: RING, height: RING },
          children: [
            shapeRing("cookie", RING, 4, palette.track, palette.solid),
            stickerStar(26, { position: "absolute", top: -15, left: (RING - 26) / 2 }),
            text(current, { ...ROUND, fontSize: 30, color: palette.highlight })
          ]
        }), "current streak", currentRange, true),
        column(palette, text(longest, { ...ROUND, fontSize: 34, color: palette.highlight }), "longest streak", longestRange)
      ], "row"),
      text(footer, { ...MONO, marginTop: 14, fontSize: 11.5, color: palette.muted, textAlign: "center" })
    ]);

    return {
      svg: await renderCard(build, WIDTH, theme, `${stats.name}'s GitHub: ${total} contributions since ${since.replace(" – now", "")}, current streak ${current} days (${currentRange}), longest streak ${longest} days (${longestRange}). ${footer}.`),
      maxAge: 60 * 60
    };
  }, async (pending) => {
    const message = pending ? "counting the days, back in a minute" : "the streak is taking a nap, back soon";
    return renderCard(messageCard(HEADER, message), WIDTH, theme, `${HEADER.title}: ${message}`);
  });
});
