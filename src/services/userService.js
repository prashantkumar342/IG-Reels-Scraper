import { fetchJson } from "../utils/httpClient.js";
import { CONFIG } from "../configs/config.js";

export async function getUserData(username) {
  const url = `${CONFIG.apiUrl}/users/web_profile_info/?username=${username}`;
  const json = await fetchJson(url, CONFIG.headers);
  const userData = json?.data?.user;

  if (!userData) throw new Error("User not found");
  if (userData.is_private) throw new Error("Account is private");

  return userData;
}