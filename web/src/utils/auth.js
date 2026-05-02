import { apiLogin, apiRegister } from "./api";
import { setAuthToken } from "./http";

/**
 * Login-Wrapper
 * Speichert Token automatisch nach erfolgreichem Login
 * @param {string} identifier - Email oder Username
 * @param {string} password - Passwort
 * @returns {Promise<{jwt: string, user: Object}>}
 */
export async function login({ identifier, password }) {
  const data = await apiLogin(identifier, password);
  if (data?.jwt) {
    setAuthToken(data.jwt);
  }
  return data;
}

/**
 * Register-Wrapper
 * Speichert Token automatisch nach erfolgreichem Register
 * @param {string} username - Username
 * @param {string} email - Email
 * @param {string} password - Passwort (mind. 6 Zeichen)
 * @returns {Promise<{jwt: string, user: Object}>}
 */
export async function register({ username, email, password }) {
  const data = await apiRegister(username, email, password);
  if (data?.jwt) {
    setAuthToken(data.jwt);
  }
  return data;
}
