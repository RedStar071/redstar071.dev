import type { Streak } from "../../utils/github";
import { embedFonts, MONO_FACE, ROUND_FACE, SANS_FACE } from "../../utils/card-fonts";
import { CARD_SHAPES } from "../../utils/card-shapes";

/**
 * The GitHub card: contributions and streaks in the spirit of github-readme-streak-stats, drawn
 * like a bento card from the site. The current streak sits in a cookie ring with a sticker star
 * where the original has its flame; the profile numbers run along the bottom in mono.
 */

const CARD = { title: "my github streak", icon: "fire", shape: "cookie", tone: "solid" } as const;

const WIDTH = 495;
const ROW_TOP = 78;
const ROW_HEIGHT = 156;
const COLUMN_GAP = 2;
const COLUMN_WIDTH = (WIDTH - 48 - COLUMN_GAP * 2) / 3;

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
    const labels = ["total contributions", "current streak", "longest streak"];

    const fonts = await embedFonts([
      { ...ROUND_FACE, text: [total, current, longest] },
      { ...SANS_FACE, text: [CARD.title, ...labels] },
      { ...MONO_FACE, text: [since, currentRange, longestRange, footer] }
    ]);

    const columns = [0, 1, 2].map(index => ({
      x: 24 + index * (COLUMN_WIDTH + COLUMN_GAP),
      y: ROW_TOP,
      width: COLUMN_WIDTH,
      height: ROW_HEIGHT
    }));
    const center = (index: number) => columns[index]!.x + COLUMN_WIDTH / 2;
    const labelY = ROW_TOP + 116;
    const rangeY = ROW_TOP + 138;

    // The ring: the cookie shape, traced in red over a track, around the current streak.
    const ringSize = 76;
    const ringX = center(1) - ringSize / 2;
    const ringY = ROW_TOP + 16;
    const ring = `<g transform="translate(${ringX} ${ringY}) scale(${ringSize / 100})">
  <path d="${CARD_SHAPES.cookie}" fill="none" stroke="var(--track)" stroke-width="6" vector-effect="non-scaling-stroke" />
  <path d="${CARD_SHAPES.cookie}" fill="none" stroke="var(--solid)" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke" pathLength="100" class="draw" />
</g>`;

    const side = (index: number, value: string, label: string, range: string, delay: number) => `<g class="rise" style="animation-delay: ${delay}ms">
  <text x="${center(index)}" y="${ROW_TOP + 72}" class="round" font-size="34" text-anchor="middle">${escapeXml(value)}</text>
  <text x="${center(index)}" y="${labelY}" class="sans" font-size="14" text-anchor="middle">${escapeXml(label)}</text>
  <text x="${center(index)}" y="${rangeY}" class="mono" font-size="11" text-anchor="middle">${escapeXml(range)}</text>
</g>`;

    const body = `${rowList("columns", columns)}
${side(0, total, labels[0]!, since, 60)}
<g class="rise" style="animation-delay: 130ms">
  ${ring}
  <text x="${center(1)}" y="${ringY + ringSize / 2 + 11}" class="round" font-size="30" text-anchor="middle">${escapeXml(current)}</text>
  ${stickerStar(center(1) - 13, ringY - 15, 26, 600)}
  <text x="${center(1)}" y="${labelY}" class="sans primary" font-size="14" text-anchor="middle">${escapeXml(labels[1]!)}</text>
  <text x="${center(1)}" y="${rangeY}" class="mono" font-size="11" text-anchor="middle">${escapeXml(currentRange)}</text>
</g>
${side(2, longest, labels[2]!, longestRange, 200)}
<text x="${WIDTH / 2}" y="${ROW_TOP + ROW_HEIGHT + 30}" class="mono rise" font-size="11.5" text-anchor="middle" style="animation-delay: 270ms">${escapeXml(footer)}</text>`;

    return {
      svg: renderCard({
        ...CARD,
        width: WIDTH,
        height: ROW_TOP + ROW_HEIGHT + 50,
        label: `${stats.name}'s GitHub: ${total} contributions since ${since.replace(" – now", "")}, current streak ${current} days (${currentRange}), longest streak ${longest} days (${longestRange}). ${footer}.`,
        theme,
        fonts: fonts.css,
        styles: `.draw { stroke-dasharray: 100; animation: draw 1.4s cubic-bezier(0.38, 1.21, 0.22, 1) 200ms both; }
@keyframes draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }`,
        body
      }),
      // Without the site's fonts the card still reads fine; try again sooner for the real thing.
      maxAge: fonts.complete ? 60 * 60 : 5 * 60
    };
  }, pending => renderMessageCard(CARD, pending ? "counting the days, back in a minute" : "the streak is taking a nap, back soon", theme));
});
