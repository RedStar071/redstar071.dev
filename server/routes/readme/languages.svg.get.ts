/** How much of each language is in the public repositories, as a README card. */
export default defineEventHandler(async (event) => {
  const theme = getCardTheme(event);
  const stats = await fetchGitHubStats(event);
  if (!stats?.languages.length)
    return sendSvg(event, renderMessageCard("most used languages", "languages are taking a nap, back soon", theme), 300);

  const count = Math.min(Math.max(Number(getQuery(event).count) || 6, 2), 10);
  const total = stats.languages.reduce((sum, language) => sum + language.size, 0);
  const languages = stats.languages.slice(0, count).map(language => ({
    ...language,
    percent: (language.size / total) * 100
  }));

  // One stacked bar, then a legend in two columns.
  const barWidth = 447;
  let offset = 0;
  const segments = languages.map((language) => {
    const width = (language.percent / 100) * barWidth;
    const segment = `<rect x="${24 + offset}" y="0" width="${width}" height="10" fill="${escapeXml(language.color)}" />`;
    offset += width;
    return segment;
  }).join("");

  const rows = Math.ceil(languages.length / 2);
  const legend = languages.map((language, index) => {
    const x = index < rows ? 24 : 262;
    const y = 96 + (index % rows) * 26;
    return `<g class="fade" style="animation-delay: ${index * 80}ms">
  <circle cx="${x + 5}" cy="${y - 5}" r="5" fill="${escapeXml(language.color)}" />
  <text x="${x + 18}" y="${y}" font-size="13">${escapeXml(truncate(language.name, 18))}</text>
  <text x="${x + 209}" y="${y}" font-size="13" class="muted" text-anchor="end">${language.percent.toFixed(1)}%</text>
</g>`;
  }).join("\n");

  const body = `<clipPath id="bar"><rect x="24" y="0" width="${barWidth}" height="10" rx="5" /></clipPath>
<g transform="translate(0 54)"><rect x="24" y="0" width="${barWidth}" height="10" rx="5" fill="var(--track)" /><g clip-path="url(#bar)">${segments}</g></g>
${legend}`;

  return sendSvg(event, renderCard({
    width: 495,
    height: 96 + (rows - 1) * 26 + 28,
    title: "most used languages",
    label: `Most used languages: ${languages.map(language => `${language.name} ${language.percent.toFixed(1)}%`).join(", ")}`,
    theme,
    body
  }), 60 * 60);
});
