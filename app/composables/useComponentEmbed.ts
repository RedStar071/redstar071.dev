import type { EmbedElement } from "discord-component-embed";
import type { DiscordCardSite } from "~/utils/discordCards";
import { toComponentEmbedJson } from "discord-component-embed";
import { withoutTrailingSlash } from "ufo";

/** Discord reads the card from a script carrying this exact id, and only one per page. */
const SCRIPT_ID = "discord:component-embed";

/**
 * Puts a Discord components v2 card into the page head, so a link to it shared on Discord
 * shows that card in place of the Open Graph preview.
 *
 * Discord never runs the page's JavaScript, so the tag has to be in the HTML the site serves.
 * Every route here is prerendered, which writes it into each HTML file at build time. The Open
 * Graph tags stay as they are: Discord falls back to them whenever it can't use the card, and
 * every other site still reads them.
 *
 * `build` receives the site details the cards share and returns a tree from `~/utils/discordCards`.
 */
export function useComponentEmbed(build: (site: DiscordCardSite) => EmbedElement) {
  const site = useSiteConfig();
  const { global, socials } = useAppConfig();

  const json = computed(() => {
    const card: DiscordCardSite = {
      url: withoutTrailingSlash(site.url),
      name: global.name,
      username: global.username,
      avatar: global.avatar,
      location: global.location,
      socials
    };

    try {
      return toComponentEmbedJson(build(card));
    } catch (error) {
      // Discord drops an invalid payload without a word and falls back to Open Graph, so the
      // build log is the only place this can show up. Keep the page rendering either way.
      console.error(`[${SCRIPT_ID}] dropped the card for this page:`, error);
      return null;
    }
  });

  useHead(() => ({
    script: json.value
      ? [{
          id: SCRIPT_ID,
          type: "application/json",
          innerHTML: json.value,
          tagPosition: "head"
        }]
      : []
  }));
}
