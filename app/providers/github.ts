import type { ProviderGetImage } from "@nuxt/image";
import { withQuery } from "ufo";

// GitHub's avatar CDN resizes on its own (`?s=`), so avatars skip IPX and
// always follow the current GitHub profile picture.
export const getImage: ProviderGetImage = (src, { modifiers = {} }) => {
  const size = Math.max(Number(modifiers.width) || 0, Number(modifiers.height) || 0);
  return {
    url: size ? withQuery(src, { s: size }) : src
  };
};
