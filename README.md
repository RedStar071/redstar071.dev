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

## GitHub profile README

Nitro also writes the README for [github.com/RedStar071](https://github.com/RedStar071), like github-readme-stats and friends, but from this site:

| Route | What it is |
| --- | --- |
| `/readme.md` | The README itself, from `content/index.yml` and the projects. Prerendered. |
| `/readme/stats.svg` | Stars, commits, PRs, issues and followers. Needs `NUXT_GITHUB_TOKEN`. |
| `/readme/languages.svg` | Most used languages across public repositories. Needs `NUXT_GITHUB_TOKEN`. |
| `/readme/listening.svg` | What's playing: Spotify when `NUXT_SPOTIFY_*` is set, Last.fm otherwise. |
| `/readme/listening` | Redirects to that track. |
| `/readme/stack.svg` | The stack, drawn with Simple Icons. Prerendered. |

Every card follows the reader's light or dark theme; add `?theme=dark` or `?theme=light` to pin one.
Copy `/readme.md` into the `RedStar071/RedStar071` repository: the cards update themselves, so it only needs copying again when the bio or the projects change.

The pages are still prerendered and served as static assets; the Worker built by Nitro's `cloudflare-module` preset only runs `/api/*` and `/readme/*`. Set the secrets on it with `wrangler secret put <NAME>` (see `.env.example`), and get a Spotify refresh token with `pnpm spotify:token`. Spotify expires it after six months, and the card falls back to Last.fm until you run it again.

## License

Licensed under [MIT](./LICENSE).
