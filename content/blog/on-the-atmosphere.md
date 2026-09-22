---
title: this site now lives on the atmosphere
description: "my projects and my writing are records in my own Bluesky repo, and the site reads them from there."
date: 2026-09-21
minRead: 2
---

this site is still a static build on Cloudflare, but a few parts of it now come from [the AT Protocol](https://atproto.com), the thing Bluesky is built on. people call that ecosystem the atmosphere.

## where the data lives

every Bluesky account has a repo: a signed collection of records that i own and can move between hosts. mine is `redstar071.dev`. the site reads two kinds of records from it:

- **projects**, stored as `dev.redstar071.project` records. when the build runs it lists them and renders the projects page. if the repo can't be reached, it falls back to the YAML files in git, so a build never depends on the network.
- **posts**, published as `site.standard.document` records under a `site.standard.publication`. that's the [standard.site](https://standard.site) format, which lets other readers and aggregators find these articles without scraping the page.

## comments

there's no comment box and no database behind one. if a post has an announcement on Bluesky, its replies are fetched from the public API in the reader's browser and shown under the article. to join in, reply to the post there.

## why bother

the site can disappear or get redesigned and the records stay. i also like that editing a project is writing a record, not opening a pull request.
