import { defineCollection, defineCollections } from "airspace";
import lexicons from "../lexicons.ts";
import { site } from "./lex/index.ts";

export const { project: projects } = defineCollections(lexicons, {
  project: { sort: [["order", "asc"]] }
});

/** The standard.site records the blog is published as, from `lexicons/site` (`pnpm lex:gen`). */
export const publication = defineCollection(site.standard.publication.main);
export const documents = defineCollection(site.standard.document.main);

export const collections = { projects, publication, documents };
