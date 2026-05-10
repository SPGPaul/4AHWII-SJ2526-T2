/**
 * User-Loading Utility
 * Lädt den aktuellen User mit allen Daten (Receipts, etc.)
 */

import {
  apiGetCurrentUser,
  extractReceiptsFromMeResponse,
  fetchReceiptsFallback,
} from "./api";

let cachedToken = null;
let cachedUserData = null;
let loadUserDataPromise = null;

function cloneUserData(userData) {
  return {
    ...userData,
    receipts: Array.isArray(userData?.receipts) ? [...userData.receipts] : [],
  };
}

/**
 * Lade alle User-Daten inklusive Receipts
 * Holt User-Daten direkt aus dem Backend.
 * @returns {Promise<Object>} User-Objekt mit receipts Array
 */
export async function loadUserData() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        username: "",
        email: "",
        receipts: [],
      };
    }

    if (cachedToken !== token) {
      cachedToken = token;
      cachedUserData = null;
      loadUserDataPromise = null;
    }

    if (cachedUserData) {
      return cloneUserData(cachedUserData);
    }

    if (loadUserDataPromise) {
      return cloneUserData(await loadUserDataPromise);
    }

    loadUserDataPromise = (async () => {
      // Hole User-Daten und Receipts
      const userResponse = await apiGetCurrentUser();
      const user =
        userResponse?.data && typeof userResponse.data === "object"
          ? userResponse.data.attributes && typeof userResponse.data.attributes === "object"
            ? {
                id: userResponse.data.id,
                documentId: userResponse.data.documentId,
                ...userResponse.data.attributes,
              }
            : userResponse.data
          : userResponse;
      let receipts = extractReceiptsFromMeResponse(user);
      if (receipts.length === 0) {
        receipts = await fetchReceiptsFallback(token, user);
      }

      return {
        ...user,
        receipts,
      };
    })();

    const loadedUserData = await loadUserDataPromise;
    cachedUserData = loadedUserData;
    return cloneUserData(loadedUserData);
  } catch (err) {
    loadUserDataPromise = null;
    console.error("Failed to load user data:", err);
    return {
      username: "",
      email: "",
      receipts: [],
    };
  }
}
