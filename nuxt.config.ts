// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/image",
    // Registered before @nuxt/ui so it is installed once; otherwise Nuxt UI merges
    // the fonts options twice and duplicates array values like the ROND axis.
    "@nuxt/fonts",
    "@nuxt/ui",
    "@nuxt/content",
    "@vueuse/nuxt",
    "nuxt-og-image",
    "nuxt-schema-org",
    "motion-v/nuxt"
  ],

  devtools: {
    enabled: true
  },

  css: ["~/assets/css/main.css"],

  site: {
    url: "https://redstar071.dev",
    name: "RedStar"
  },

  colorMode: {
    preference: "dark",
    fallback: "dark"
  },

  content: {
    experimental: {
      sqliteConnector: "native"
    }
  },
  runtimeConfig: {
    // Kept server-side: the browser only ever calls our small /api/lastfm proxy.
    lastfmApiKey: "",
    // For the README cards under /readme/*, set as Worker secrets (see .env.example).
    githubToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    spotifyRefreshToken: "",
    public: {
      lastfmUsername: "redstar071",
      githubUsername: "RedStar071"
    }
  },

  future: {
    compatibilityVersion: 5
  },

  compatibilityDate: "2026-06-30",

  nitro: {
    // Every page is still prerendered and served as a static asset; the Worker only
    // answers what has to be live: /api/lastfm and the README cards under /readme/*.
    preset: "cloudflare-module",
    prerender: {
      routes: [
        "/",
        "/rss.xml",
        "/readme.md",
        "/readme/stack.svg",
        // Written by `nuxt generate` on its own; a server build has to ask. 404.html is the
        // page Cloudflare serves for an unknown path (`not_found_handling` in wrangler.jsonc).
        "/200.html",
        "/404.html"
      ],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      // @antfu/eslint-config provides the base and stylistic rules (see eslint.config.mjs).
      standalone: false,
      nuxt: {
        sortConfigKeys: true
      }
    }
  },

  fonts: {
    families: [
      { name: "Google Sans Flex", provider: "google", weights: ["300 900"] },
      { name: "Google Sans Code", provider: "google", weights: ["400 600"] }
    ],
    google: {
      experimental: {
        variableAxis: {
          "Google Sans Flex": { ROND: [["0", "100"]] }
        }
      }
    }
  },

  icon: {
    clientBundle: {
      scan: {
        globInclude: ["app/**/*.{vue,ts}", "content/**/*.yml"]
      }
    }
  },

  image: {
    domains: ["avatars.githubusercontent.com"],
    providers: {
      github: {
        name: "github",
        provider: "~/providers/github.ts"
      }
    }
  },

  ogImage: {
    zeroRuntime: true
  }
});
