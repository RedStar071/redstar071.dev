/**
 * Writes `sitemap.xml` once prerendering has finished, from the routes Nitro
 * actually rendered, so it never lists a page that does not exist. Adapted from
 * danielroe/roe.dev's `modules/sitemap.ts`.
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineNuxtModule, useNuxt } from "nuxt/kit";
import { joinURL } from "ufo";

/** Prerendered as HTML, but not pages a reader or a crawler should land on. */
const EXCLUDED_ROUTES = new Set(["/200", "/404", "/200.html", "/404.html"]);

export default defineNuxtModule({
  meta: { name: "sitemap" },
  setup() {
    const nuxt = useNuxt();

    nuxt.hook("nitro:init", (nitro) => {
      nitro.hooks.hook("close", async () => {
        // `site` is typed as nuxt-site-config's module options, which omit the config it accepts
        const site = nuxt.options.site as { url?: string } | false | undefined;
        const siteUrl = site ? site.url : undefined;
        if (!siteUrl) {
          return;
        }

        const routes = nitro._prerenderedRoutes
          ?.filter(route => route.fileName?.endsWith(".html") && !EXCLUDED_ROUTES.has(route.route))
          .map(route => route.route)
          .sort();
        if (!routes?.length) {
          return;
        }

        const sitemap = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...routes.map(route => `<url><loc>${joinURL(siteUrl, route)}</loc></url>`),
          `</urlset>`
        ].join("\n");

        await writeFile(join(nitro.options.output.publicDir, "sitemap.xml"), sitemap);
      });
    });
  }
});
