**[redstar071.dev](https://redstar071.dev)**

This is the code and content for my personal website, built in [Nuxt](https://nuxt.com/) with [Nuxt UI](https://ui.nuxt.com) and deployed on Cloudflare Workers.

> **Note**
> I use this site as a playground for testing new tools, ideas, features and concepts. I would advise against copying code directly from here.

## Development

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
pnpm preview  # preview the production build
```

## Writing and publishing

Articles live in `content/blog/*.md`. The filename becomes the URL: `ai-in-open-source.md` is served at `/blog/ai-in-open-source`. Each article starts with YAML metadata:

```yaml
---
title: how i use AI in open source
description: "AI can help me maintain my projects, but the decisions and responsibility stay with me."
date: 2026-10-02
minRead: 3
---
```

Write the article in Markdown below that block. `minRead` is set manually. Optional fields include `image`, `author` and `bluesky` (the full `at://` URI of an announcement post).

The home page shows the three most recent articles. `/blog`, labelled **writing**, lists all articles newest first. Its title and description come from `content/blog.yml`. There is no draft or scheduled-publication filter: every Markdown article in this folder is included in the next build, even if its date is in the future.

To preview an article, run `pnpm dev` and open `/blog` or its individual URL on the local server. To publish:

1. Save the article and commit the changes to keep them in version control.
2. Authenticate with Cloudflare using `pnpm exec wrangler login` if needed.
3. Set `ATPROTO_APP_PASSWORD` in `.env` to a Bluesky app password if you want the AT Protocol records to sync.
4. Run `pnpm deploy`. It builds the site with `--sync`, synchronizes the blog as `site.standard.*` records, then deploys the site and Worker to Cloudflare.

The website reads the articles from Markdown; the AT Protocol records are a synchronized copy for other readers. A plain `pnpm build` does not write those records. Sync failures are logged and do not prevent the Cloudflare deployment. The checked-in GitHub Actions workflows run checks, but do not deploy; any Cloudflare Git integration would be configured separately.

For comments, announce the article on Bluesky and add that post's `at://` URI to the article's `bluesky` field before rebuilding. Replies to that post appear below the article. The deploy sync can also discover an existing announcement and save its URI into the Markdown, but this happens after prerendering, so the website picks up a newly discovered URI on the next build. It does not create an announcement for you.

The repository also includes a Pages CMS configuration in `.pages.yml`: **Writing** edits articles and **Writing page** edits the listing's title and description. Changes are saved to Git and still need a deployment to reach the website.

## GitHub profile README

Nitro also writes the README for [github.com/RedStar071](https://github.com/RedStar071), like github-readme-stats and friends, but from this site:

| Route | What it is |
| --- | --- |
| `/readme.md` | The README itself, from `content/index.yml` and the projects. Prerendered. |
| `/readme/stats.svg` | Stars, commits, PRs, issues and followers. Needs `NUXT_GITHUB_TOKEN`. |
| `/readme/languages.svg` | Most used languages across public repositories. Needs `NUXT_GITHUB_TOKEN`. |

Every card follows the reader's light or dark theme; add `?theme=dark` or `?theme=light` to pin one.
Copy `/readme.md` into the `RedStar071/RedStar071` repository: the stats cards update themselves, so it only needs copying again when the bio or the projects change.

The pages are still prerendered and served as static assets; the Worker built by Nitro's `cloudflare-module` preset only runs `/api/*` and `/readme/*`. Set the secrets on it with `wrangler secret put <NAME>` (see `.env.example`).

## License

Licensed under [MIT](./LICENSE).
