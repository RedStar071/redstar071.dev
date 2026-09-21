// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    // Registered before @nuxt/ui so it is installed once; otherwise Nuxt UI merges
    // the fonts options twice and duplicates array values like the ROND axis.
    '@nuxt/fonts',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'motion-v/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://redstar071.dev',
    name: 'RedStar'
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark'
  },

  compatibilityDate: '2024-11-01',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
    }
  },

  fonts: {
    families: [
      { name: 'Google Sans Flex', provider: 'google', weights: ['300 900'] },
      { name: 'Google Sans Code', provider: 'google', weights: ['400 600'] }
    ],
    google: {
      experimental: {
        variableAxis: {
          'Google Sans Flex': { ROND: [['0', '100']] }
        }
      }
    }
  },

  icon: {
    clientBundle: {
      scan: {
        globInclude: ['app/**/*.{vue,ts}', 'content/**/*.yml']
      }
    }
  },

  image: {
    domains: ['avatars.githubusercontent.com'],
    providers: {
      github: {
        name: 'github',
        provider: '~/providers/github.ts'
      }
    }
  },

  ogImage: {
    fonts: ['Google Sans Flex:400', 'Google Sans Flex:800']
  },

  eslint: {
    standalone: false,
    nuxt: {
      sortConfigKeys: true,
    },
    config: {
      satisfies: {
        indent: 2,
        quotes: "double",
        semi: true,
        jsx: true,
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
