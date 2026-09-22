# Nuxt Portfolio Template

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

Use this template to create your own portfolio with [Nuxt UI](https://ui.nuxt.com).

- [Live demo](https://portfolio-template.nuxt.dev/)
- [Documentation](https://ui.nuxt.com/getting-started/installation)

<a href="https://portfolio-template.nuxt.dev/" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ui.nuxt.com/assets/templates/nuxt/portfolio-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://ui.nuxt.com/assets/templates/nuxt/portfolio-light.png">
    <img alt="Nuxt Portfolio Template" src="https://ui.nuxt.com/assets/templates/nuxt/portfolio-dark.png">
  </picture>
</a>

## Quick Start

```bash [Terminal]
npm create nuxt@latest -- -t github:nuxt-ui-templates/portfolio
```

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-name=portfolio&repository-url=https%3A%2F%2Fgithub.com%2Fnuxt-ui-templates%2Fportfolio&demo-image=https%3A%2F%2Fui.nuxt.com%2Fassets%2Ftemplates%2Fnuxt%2Fportfolio-dark.png&demo-url=https%3A%2F%2Fportfolio-template.nuxt.dev%2F&demo-title=Nuxt%20Portfolio%20Template&demo-description=A%20sleek%20portfolio%20template%20to%20showcase%20your%20work%2C%20skills%20and%20blog%20powered%20by%20Nuxt%20Content.)

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

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

## Renovate integration

Install [Renovate GitHub app](https://github.com/apps/renovate/installations/select_target) on your repository and you are good to go.
