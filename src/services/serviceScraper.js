import { HEADERS, GRAPHQL_DOC_ID } from "../configs/config.js";
import { fetchJson } from "../utils/fetcher.js";

export async function scrapeReels(username, limit = 5) {
  try {
    // 1. Validate profile
    const profileJson = await fetchJson(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      HEADERS
    );

    const user = profileJson?.data?.user;
    if (!user) throw new Error("User not found");
    if (user.is_private) throw new Error("Account is private");

    // 2. Fetch reels
    const reels = [];
    let cursor = null;
    const batchSize = Math.max(12, limit * 2);

    while (reels.length < limit) {
      const variables = {
        after: cursor,
        first: batchSize,
        username,
        data: {
          count: batchSize,
          include_reel_media_seen_timestamp: true,
          include_relationship_info: true,
          latest_besties_reel_media: true,
          latest_reel_media: true,
        },
      };

      const queryParams = new URLSearchParams({
        doc_id: GRAPHQL_DOC_ID,
        variables: JSON.stringify(variables),
      }).toString();

      const gqlJson = await fetchJson(
        `https://www.instagram.com/graphql/query/?${queryParams}`,
        HEADERS
      );

      const pageData =
        gqlJson?.data?.xdt_api__v1__feed__user_timeline_graphql_connection;
      if (!pageData) throw new Error("Failed to load media");

      for (const edge of pageData.edges || []) {
        const n = edge.node;
        if (n.media_type === 2 && n.product_type === "clips") {
          reels.push({
            id: n.id,
            reel_url: `https://www.instagram.com/reel/${n.code}/`,
            video_url: n.video_versions?.[0]?.url || null,
            thumbnail_url: n.image_versions2?.candidates?.[0]?.url || null,
            caption: n.caption?.text || "",
            posted_at: new Date(n.taken_at * 1000).toISOString(),
            views: n.view_count || n.play_count || null,
            likes: n.like_count || null,
            comments: n.comment_count || null,
          });
        }
        if (reels.length >= limit) break;
      }

      cursor = pageData.page_info?.end_cursor;
      if (!pageData.page_info?.has_next_page) break;
    }

    return { username, reels: reels.slice(0, limit) };
  } catch (err) {
    console.error("Scraping error:", err.message);
    if (err.message.includes("private")) return { error: "Account is private" };
    if (err.message.includes("not found")) return { error: "User not found" };
    if (err.message.includes("rate limit")) return { error: "Rate limit exceeded" };
    return { error: "Failed to load" };
  }
}
