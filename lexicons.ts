/**
 * The `dev.redstar071.*` schemas. `shared/collections.ts` turns each record
 * into a collection, and `pnpm lex:publish` publishes them.
 *
 * `record(fields, options)` rather than the bare field map, because a project
 * has a `description` field, which the bare form would read as the record's own.
 */
import { defineLexicons, field, l, record } from "airspace/lexicon";

export default defineLexicons("dev.redstar071", {
  project: record({
    title: field.text({ max: 256 }),
    description: field.text({ max: 2500 }),
    role: field.text({ max: 128 }).describe("What I do on it, e.g. maintainer."),
    logo: field.text({ max: 512 }).describe("Path of an image under public/, e.g. /logos/wolfstar.svg.").optional(),
    icon: field.text({ max: 128 }).describe("Icon name used when there is no logo.").optional(),
    url: field.url().describe("The project's website, if it has one.").optional(),
    repo: field.url(),
    tags: field.list(field.text({ max: 64 }), { max: 16 }),
    since: field.number({ min: 1970 }),
    status: field.enum(["active", "in development", "archived"]),
    featured: field.raw(l.withDefault(l.boolean(), false)),
    order: field.raw(l.integer({ description: "Lower values render first." }))
  }, {
    key: "any",
    description: "A project shown on redstar071.dev. The record key is the project's slug, and the site falls back to content/projects/*.yml when no records are readable."
  })
});
