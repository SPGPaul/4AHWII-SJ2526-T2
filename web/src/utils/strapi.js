/**
 * Central Strapi base URL.
 *
 * In development (npm run dev) this defaults to "" so that all Strapi requests
 * go through the Vite dev-server proxy to http://localhost:1337 automatically —
 * no env var needed for local development.
 *
 * In production builds the cloud URL is used as the fallback.
 *
 * To override (e.g. point dev at the cloud instance), create a `.env.local` in
 * /web/ with:
 *   VITE_STRAPI_URL=https://elegant-eggs-b247740f2b.strapiapp.com
 */
export const STRAPI_URL = "http://localhost:1337";
/*import.meta.env.VITE_STRAPI_URL ??
  (import.meta.env.DEV ? "" : "http://localhost:1337");*/
