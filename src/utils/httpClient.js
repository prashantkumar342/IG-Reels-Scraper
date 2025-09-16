import fetch from "node-fetch";

export async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 404) throw new Error("User not found");
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}