import { fetchJson } from "../utils/httpClient.js";
import { CONFIG } from "../configs/config.js";

// Simple in-memory cache for pagination cursors
const paginationCache = new Map();

export async function fetchReelsWithCursor(username, limit, page = 1, batchSize) {
  const cacheKey = `${username}_reels`;

  // Get or initialize pagination state
  let paginationState = paginationCache.get(cacheKey) || {
    cursors: [null], // Array of cursors for each page (null for first page)
    reels: [], // All fetched reels
    lastFetchedPage: 0,
    hasMore: true
  };

  // Calculate which page we need data for
  const targetPage = Math.max(1, page);

  // If we already have this page or beyond, return cached data
  if (targetPage <= paginationState.lastFetchedPage && paginationState.reels.length > 0) {
    const startIdx = (targetPage - 1) * limit;
    const endIdx = startIdx + limit;
    return {
      reels: paginationState.reels.slice(startIdx, endIdx),
      hasMore: endIdx < paginationState.reels.length || paginationState.hasMore,
      currentPage: targetPage,
      totalFetched: paginationState.reels.length
    };
  }

  // Need to fetch more data
  let after = paginationState.cursors[paginationState.lastFetchedPage] || null;
  const targetReelsNeeded = targetPage * limit;

  while (paginationState.reels.length < targetReelsNeeded && paginationState.hasMore) {
    const variables = {
      after,
      before: null,
      data: {
        count: batchSize,
        include_reel_media_seen_timestamp: true,
        include_relationship_info: true,
        latest_besties_reel_media: true,
        latest_reel_media: true,
      },
      first: batchSize,
      last: null,
      username,
      __relay_internal__pv__PolarisIsLoggedInrelayprovider: true,
      __relay_internal__pv__PolarisShareSheetV3relayprovider: true,
    };

    const queryParams = new URLSearchParams({
      doc_id: CONFIG.docId,
      variables: JSON.stringify(variables),
    }).toString();

    const url = `${CONFIG.baseUrl}/graphql/query/?${queryParams}`;
    const pageJson = await fetchJson(url, CONFIG.headers);
    const pageData = pageJson?.data?.xdt_api__v1__feed__user_timeline_graphql_connection;

    if (!pageData) throw new Error("Failed to load media");

    const edges = pageData.edges || [];
    let newReels = [];

    for (const edge of edges) {
      const node = edge.node;
      if (node.media_type === 2 && node.product_type === "clips") {
        newReels.push({
          id: node.id,
          reel_url: `https://www.instagram.com/reel/${node.code}/`,
          video_url: node.video_versions?.[0]?.url || null,
          thumbnail_url: node.image_versions2?.candidates?.[0]?.url || null,
          caption: node.caption?.text || "",
          posted_at: new Date(node.taken_at * 1000).toISOString(),
          views: node.view_count || node.play_count || null,
          likes: node.like_count || null,
          comments: node.comment_count || null,
        });
      }
    }

    // Add new reels to our collection
    paginationState.reels.push(...newReels);

    // Update pagination state
    after = pageData.page_info?.end_cursor;
    const hasNext = pageData.page_info?.has_next_page;

    if (hasNext && after) {
      // Store cursor for next potential page
      const nextPageIndex = Math.floor(paginationState.reels.length / limit);
      paginationState.cursors[nextPageIndex] = after;
    }

    paginationState.hasMore = hasNext;
    paginationState.lastFetchedPage = Math.floor(paginationState.reels.length / limit);

    if (!hasNext || newReels.length === 0) break;
  }

  // Update cache
  paginationCache.set(cacheKey, paginationState);

  // Return requested page
  const startIdx = (targetPage - 1) * limit;
  const endIdx = startIdx + limit;

  return {
    reels: paginationState.reels.slice(startIdx, endIdx),
    hasMore: endIdx < paginationState.reels.length || paginationState.hasMore,
    currentPage: targetPage,
    totalFetched: paginationState.reels.length
  };
}

// Clear cache for a user (call this when starting a new search)
export function clearUserCache(username) {
  const cacheKey = `${username}_reels`;
  paginationCache.delete(cacheKey);
}

// Clear all cache (optional utility)
export function clearAllCache() {
  paginationCache.clear();
}