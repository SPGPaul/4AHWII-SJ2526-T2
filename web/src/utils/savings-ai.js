import { apiGetSavingsRecommendations } from "./api";

export async function getSavingsRecommendations(payload) {
  return await apiGetSavingsRecommendations(payload);
}
