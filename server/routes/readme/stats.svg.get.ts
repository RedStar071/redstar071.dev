/** GitHub numbers as a README card, in the spirit of github-readme-stats. */
export default defineEventHandler(async (event) => {
  const theme = getCardTheme(event);
  const stats = await fetchGitHubStats(event);
  if (!stats)
    return sendSvg(event, renderMessageCard("github stats", "stats are taking a nap, back soon", theme), 300);

  const rows = [
    ["Stars earned", stats.stars],
    ["Commits (last year)", stats.commits],
    ["Pull requests", stats.pullRequests],
    ["Issues", stats.issues],
    ["Contributed to", stats.contributedTo],
    ["Followers", stats.followers]
  ] as const;

  // Two columns of three, each row fading in a beat after the one before.
  const body = rows.map(([label, value], index) => {
    const x = index < 3 ? 24 : 262;
    const y = 74 + (index % 3) * 32;
    return `<g class="fade" style="animation-delay: ${index * 90}ms">
  <circle cx="${x + 5}" cy="${y - 5}" r="4" fill="var(--accent)" />
  <text x="${x + 18}" y="${y}" font-size="14" class="muted">${escapeXml(label)}</text>
  <text x="${x + 209}" y="${y}" font-size="14" font-weight="700" text-anchor="end">${formatCount(value)}</text>
</g>`;
  }).join("\n");

  const title = "github stats";
  return sendSvg(event, renderCard({
    width: 495,
    height: 164,
    title,
    label: `${stats.name}'s GitHub stats: ${rows.map(([label, value]) => `${label} ${value}`).join(", ")}`,
    theme,
    body
  }), 60 * 60);
});
