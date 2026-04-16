/**
 * Central Strapi base URL.
 *
 * Override for local development by creating a `.env.local` file in /web/ with:
 *   VITE_STRAPI_URL=http://localhost:1337
 */
export const STRAPI_URL =
  import.meta.env.VITE_STRAPI_URL || "https://elegant-eggs-b247740f2b.strapiapp.com";
