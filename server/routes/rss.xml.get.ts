import { queryCollection } from "@nuxt/content/server";
import { joinURL } from "ufo";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The blog as an RSS 2.0 feed, prerendered to `/rss.xml`. */
export default defineEventHandler(async (event) => {
  const site = getSiteConfig(event);
  const posts = await queryCollection(event, "blog").order("date", "DESC").all();

  const items = posts.map(post => [
    "<item>",
    `<title>${escapeXml(post.title)}</title>`,
    `<link>${joinURL(site.url, post.path)}</link>`,
    `<guid isPermaLink="true">${joinURL(site.url, post.path)}</guid>`,
    `<pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
    `<description>${escapeXml(post.description)}</description>`,
    "</item>"
  ].join(""));

  setResponseHeader(event, "content-type", "application/rss+xml; charset=utf-8");
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    "<channel>",
    `<title>${escapeXml(site.name)}</title>`,
    `<link>${site.url}</link>`,
    `<description>${escapeXml("Notes on Discord bots, Nuxt and the tools I build.")}</description>`,
    `<atom:link href="${joinURL(site.url, "rss.xml")}" rel="self" type="application/rss+xml" />`,
    ...items,
    "</channel>",
    "</rss>"
  ].join("\n");
});
