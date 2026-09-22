import type { BlogCollectionItem, IndexCollectionItem, PagesCollectionItem, ProjectsCollectionItem } from "@nuxt/content";
import type { EmbedElement } from "discord-component-embed";
import { ActionRow, Container, h, LinkButton, Section, Separator, TextDisplay, Thumbnail } from "discord-component-embed";
import { hasProtocol, joinURL } from "ufo";

/**
 * Discord components v2 cards for the site's link previews.
 *
 * Every builder returns a plain component tree; `useComponentEmbed` turns it into the JSON
 * Discord reads. The trees are built with `h()` rather than JSX because Vue's JSX compiles to
 * Vue VNodes, which the package rejects.
 */

/** The parts of the site config and app config a card needs, resolved once by `useComponentEmbed`. */
export interface DiscordCardSite {
  /** Absolute site origin, without a trailing slash. */
  url: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
  socials: readonly { label: string; to: string }[];
}

type CardProject = Pick<ProjectsCollectionItem, "title" | "description" | "url" | "repo">;
type CardPost = Pick<BlogCollectionItem, "title" | "description" | "path" | "date" | "minRead" | "image">;
type CardPage = Pick<PagesCollectionItem, "title" | "description" | "path">;

/** Discord fetches every URL in the card itself, so the relative paths content files carry have to be absolute. */
function absolute(site: DiscordCardSite, path: string) {
  return hasProtocol(path) ? path : joinURL(site.url, path);
}

/** Trims a description down to one readable row: its first sentence, cut at the last word that fits. */
function summarize(text: string, max = 72) {
  const [sentence = text] = text.split(". ");
  const trimmed = sentence.replace(/\.$/, "");
  if (trimmed.length <= max) {
    return trimmed;
  }

  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:]$/, "")}…`;
}

/** Builds the thumbnail used to identify the site owner across cards. */
function avatar(site: DiscordCardSite) {
  return h(Thumbnail, { url: site.avatar, description: `${site.name}'s avatar` });
}

/** Builds a linked card title followed by its description. */
function heading(site: DiscordCardSite, title: string, url: string, description: string) {
  return h(TextDisplay, null, `# [${title}](${absolute(site, url)})\n${description}`);
}

/** Builds up to Discord's maximum number of social link buttons. */
function socialButtons(site: DiscordCardSite) {
  return site.socials.slice(0, MAX_EMBED_BUTTONS).map(social => h(LinkButton, { url: social.to, label: social.label }));
}

/** Formats a project as a linked, summarized markdown list row. */
function projectLine(site: DiscordCardSite, project: CardProject) {
  return `- [${project.title}](${absolute(site, project.url ?? project.repo)}) — ${summarize(project.description)}`;
}

/** Formats a post as a linked markdown list row with its publication date. */
function postLine(site: DiscordCardSite, post: CardPost) {
  return `- [${post.title}](${absolute(site, post.path)}) — ${formatDate(post.date)}`;
}

/** A list of markdown rows under a bold label, or nothing at all when there is no row to show. */
function listBlock(label: string, lines: string[]) {
  return lines.length ? [h(Separator, { divider: true, spacing: "small" }), h(TextDisplay, null, `**${label}**\n${lines.join("\n")}`)] : [];
}

/** The home page: who RedStar is, what he maintains, and where to find him. */
export function buildProfileCard(site: DiscordCardSite, page: Pick<IndexCollectionItem, "description">, projects: CardProject[]): EmbedElement {
  return h(
    Container,
    { accentColor: BRAND_ACCENT_COLOR },
    h(
      Section,
      { accessory: avatar(site) },
      heading(site, site.name, "/", page.description),
      h(TextDisplay, null, `-# ${site.location} · @${site.username}`)
    ),
    ...listBlock("what i've made", projects.slice(0, MAX_EMBED_LIST_ITEMS).map(project => projectLine(site, project))),
    ...(site.socials.length ? [h(ActionRow, null, socialButtons(site))] : [])
  );
}

/** The projects page, with the same list the page opens with. */
export function buildProjectsCard(site: DiscordCardSite, page: CardPage, projects: CardProject[]): EmbedElement {
  return h(
    Container,
    { accentColor: BRAND_ACCENT_COLOR },
    h(
      Section,
      { accessory: avatar(site) },
      heading(site, page.title, page.path, page.description)
    ),
    ...listBlock("the list", projects.slice(0, MAX_EMBED_LIST_ITEMS).map(project => projectLine(site, project))),
    h(ActionRow, null, [
      h(LinkButton, { url: absolute(site, page.path), label: "all projects" }),
      h(LinkButton, { url: site.url, label: site.name })
    ])
  );
}

/** The blog index, with the most recent posts. */
export function buildWritingCard(site: DiscordCardSite, page: CardPage, posts: CardPost[]): EmbedElement {
  return h(
    Container,
    { accentColor: BRAND_ACCENT_COLOR },
    h(
      Section,
      { accessory: avatar(site) },
      heading(site, page.title, page.path, page.description)
    ),
    ...listBlock("latest", posts.slice(0, MAX_EMBED_LIST_ITEMS).map(post => postLine(site, post))),
    h(ActionRow, null, [
      h(LinkButton, { url: absolute(site, page.path), label: "all writing" }),
      h(LinkButton, { url: absolute(site, "/rss.xml"), label: "RSS" })
    ])
  );
}

/** A single post. Its cover art becomes the thumbnail when it has one. */
export function buildPostCard(site: DiscordCardSite, post: CardPost): EmbedElement {
  const url = absolute(site, post.path);

  return h(
    Container,
    { accentColor: BRAND_ACCENT_COLOR },
    h(
      Section,
      { accessory: post.image ? h(Thumbnail, { url: absolute(site, post.image), description: post.title }) : avatar(site) },
      heading(site, post.title, post.path, post.description),
      h(TextDisplay, null, `-# ${formatDate(post.date)} · ${post.minRead} min read · by ${site.name}`)
    ),
    h(ActionRow, null, [
      h(LinkButton, { url, label: "read the post" }),
      h(LinkButton, { url: absolute(site, "/rss.xml"), label: "RSS" })
    ])
  );
}
