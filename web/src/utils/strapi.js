/**
 * Central Strapi base URL.
 *
 * Defaults to the local Strapi port on the host machine and can be overridden
 * with VITE_STRAPI_URL for remote deployments.
 */
export const STRAPI_URL =
  import.meta.env.VITE_STRAPI_URL ?? "http://localhost:1337";
