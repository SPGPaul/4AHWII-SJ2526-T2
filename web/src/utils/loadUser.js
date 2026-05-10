/**
 * User-Loading Utility
 * Lädt den aktuellen User mit allen Daten (Receipts, etc.)
 */

import { apiGetCurrentUser, apiGetReceipts } from "./api";

/**
 * Lade alle User-Daten inklusive Receipts
 * Falls nicht authentifiziert, Returns Demo-Daten
 * @returns {Promise<Object>} User-Objekt mit receipts Array
 */
export async function loadUserData() {
  try {
    const token = localStorage.getItem("token");

    // if (!token) {
    //   // Demo-Modus
    //   const receipts = await apiGetReceipts();
    //   return {
    //     username: "Demo User",
    //     email: "demo@example.com",
    //     receipts,
    //   };
    // }

    // Hole User-Daten und Receipts
    const user = await apiGetCurrentUser();
    // const receipts = await apiGetReceipts();

    return {
      ...user,
      // receipts,
    };
  } catch (err) {
    console.error("Failed to load user data:", err);
    // Fallback zu Demo
    // const receipts = await apiGetReceipts();
    // return {
    //   username: "Demo User",
    //   email: "demo@example.com",
    //   receipts,
    // };
  }
}
