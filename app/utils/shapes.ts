/**
 * Rounded five-point star in a 100x100 box, the same chubby star that
 * sits around the avatar. Generated from a polygon with filleted corners.
 */
export const STAR_PATH = "M54.9 8.7L63.4 23.8Q65.8 28.1 70.7 29.1L87.7 32.5Q97.5 34.5 90.7 41.9L79.0 54.6Q75.6 58.3 76.2 63.3L78.2 80.5Q79.3 90.4 70.3 86.2L54.5 79.0Q50 77 45.4 79.0L29.7 86.2Q20.6 90.4 21.7 80.5L23.7 63.3Q24.3 58.3 20.9 54.6L9.2 41.9Q2.4 34.5 12.2 32.5L29.2 29.1Q34.1 28.1 36.5 23.8L45.0 8.7Q50 0 54.9 8.7Z";

export type Shape = "cookie" | "burst" | "flower" | "clover" | "sunny" | "star";

/** Static class map so Tailwind can see every mask utility. */
export const shapeClasses: Record<Shape, string> = {
  cookie: "shape-cookie",
  burst: "shape-burst",
  flower: "shape-flower",
  clover: "shape-clover",
  sunny: "shape-sunny",
  star: "shape-star"
};
