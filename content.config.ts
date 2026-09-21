import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const createBaseSchema = () => z.object({
  title: z.string(),
  description: z.string()
})

const createCardSchema = () => z.object({
  title: z.string().nonempty()
})

const createAuthorSchema = () => z.object({
  name: z.string(),
  description: z.string().optional(),
  username: z.string().optional(),
  to: z.string().optional(),
  avatar: z.object({
    src: z.string().editor({ input: 'media' }),
    alt: z.string()
  }).optional()
})

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: 'page',
      source: 'index.yml',
      schema: z.object({
        hero: z.object({
          greeting: z.string().nonempty(),
          bio: z.string().nonempty()
        }),
        about: createCardSchema().extend({
          items: z.array(z.string().nonempty())
        }),
        socials: createCardSchema(),
        projects: createCardSchema(),
        presence: createCardSchema(),
        stack: createCardSchema().extend({
          items: z.array(z.object({
            label: z.string().nonempty(),
            icon: z.string().nonempty().editor({ input: 'icon' })
          }))
        }),
        writing: createCardSchema()
      })
    }),
    projects: defineCollection({
      type: 'data',
      source: 'projects/*.yml',
      schema: z.object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
        role: z.string().nonempty(),
        logo: z.string().editor({ input: 'media' }).optional(),
        icon: z.string().editor({ input: 'icon' }).optional(),
        url: z.string().optional(),
        repo: z.string().nonempty(),
        tags: z.array(z.string()),
        since: z.number().int(),
        status: z.enum(['active', 'in development', 'archived']),
        featured: z.boolean().default(false),
        order: z.number().int()
      })
    }),
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        minRead: z.number(),
        date: z.date(),
        image: z.string().editor({ input: 'media' }).optional(),
        author: createAuthorSchema().optional()
      })
    }),
    pages: defineCollection({
      type: 'page',
      source: [
        { include: 'projects.yml' },
        { include: 'blog.yml' }
      ],
      schema: createBaseSchema()
    })
  }
})
