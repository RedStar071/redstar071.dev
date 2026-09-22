const SOURCE_NAMES = { spotify: "Spotify", lastfm: "Last.fm" } as const;

/** The track playing right now, or the last one played, as a README card. */
export default defineEventHandler(async (event) => {
  const theme = getCardTheme(event);
  const track = await fetchListeningCached(event);
  // No proxy caching at all: GitHub's camo would otherwise hold a song long after it ended.
  if (!track)
    return sendSvg(event, renderMessageCard("what i'm listening to", "the music has stopped, for now", theme), 0);

  const cover = await inlineImage(track.image);
  const source = SOURCE_NAMES[track.source];
  const status = track.isNowPlaying
    ? `NOW PLAYING ON ${source.toUpperCase()}`
    : `LAST PLAYED ON ${source.toUpperCase()}${track.playedAt ? ` · ${formatAgo(track.playedAt).toUpperCase()}` : ""}`;
  const subtitle = [track.artist, track.album].filter(Boolean).join(" · ");

  const artwork = cover
    ? `<clipPath id="cover"><rect x="24" y="54" width="64" height="64" rx="8" /></clipPath>
<image href="${cover}" x="24" y="54" width="64" height="64" clip-path="url(#cover)" preserveAspectRatio="xMidYMid slice" />`
    : `<rect x="24" y="54" width="64" height="64" rx="8" fill="var(--track)" />
<circle cx="56" cy="86" r="18" fill="none" stroke="var(--muted)" stroke-width="2" /><circle cx="56" cy="86" r="4" fill="var(--muted)" />`;

  // Three bars out of phase, like the equalizer on the site's listening card.
  const equalizer = track.isNowPlaying
    ? `<g transform="translate(449 22)">${[0, 0.18, 0.36].map((delay, index) =>
      `<rect class="bar" x="${index * 7}" y="0" width="4" height="16" rx="2" fill="var(--accent)" style="animation-delay: ${delay}s" />`).join("")}</g>`
    : "";

  const body = `${artwork}
${equalizer}
<g class="fade">
  <text x="104" y="68" font-size="11" font-weight="600" letter-spacing="0.6" class="accent">${escapeXml(status)}</text>
  <text x="104" y="92" font-size="16" font-weight="700">${escapeXml(truncate(track.title, 38))}</text>
  <text x="104" y="112" font-size="13" class="muted">${escapeXml(truncate(subtitle, 52))}</text>
</g>`;

  return sendSvg(event, renderCard({
    width: 495,
    height: 138,
    title: "what i'm listening to",
    label: `${track.isNowPlaying ? "Now playing" : "Last played"} on ${source}: ${track.title} by ${track.artist}`,
    theme,
    body,
    styles: `.bar { transform-box: fill-box; transform-origin: bottom; animation: equalize 0.9s ease-in-out infinite alternate; }
@keyframes equalize { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }`
  }), 0);
});
