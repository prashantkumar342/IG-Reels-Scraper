import { Router } from "express";
// import { scrapeReels } from "../scraper.js";
import { scrapeReels } from "../controller/scrapeReels.js";


const router = Router();

router.get("/scrape", async (req, res) => {
  const { username, limit = 5 } = req.query;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  try {
    const data = await scrapeReels(username, parseInt(limit));
    res.json(data);
  } catch (err) {
    console.error("Scraping failed:", err.message);
    res.status(500).json({ error: "Failed to scrape reels" });
  }
});

export default router;
