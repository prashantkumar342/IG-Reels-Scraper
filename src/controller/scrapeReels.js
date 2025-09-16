import { getUserData } from "../services/userService.js";
import { fetchReelsWithCursor, clearUserCache } from "../services/reelsService.js";
import { CONFIG } from "../configs/config.js";

export async function scrapeReels(username, limit = 5, page = 1, clearCache = false) {
  try {
    await getUserData(username); // Validate user

    // Clear cache if requested (useful for new searches)
    if (clearCache) {
      clearUserCache(username);
    }

    const batchSize = Math.max(12, limit * CONFIG.batchSizeMultiplier);
    const result = await fetchReelsWithCursor(username, limit, page, batchSize);

    return {
      username,
      reels: result.reels,
      hasMore: result.hasMore,
      currentPage: result.currentPage,
      totalFetched: result.totalFetched
    };
  } catch (err) {
    console.error("Scraping error:", err);
    if (err.message.includes("private")) throw new Error("Account is private");
    if (err.message.includes("not found")) throw new Error("User not found");
    if (err.message.includes("rate limit")) throw new Error("Rate limit exceeded");
    throw new Error("Failed to load");
  }
}