import dotenv from "dotenv";
dotenv.config();

const { sessionid, csrftoken, ds_user_id, mid, IG_GRAPHQL_DOC_ID, api_url, base_url, X_IG_App_ID } = process.env

const cookie = `sessionid=${sessionid}; csrftoken=${csrftoken}; ds_user_id=${ds_user_id}; mid=${mid}`

export const CONFIG = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "X-IG-App-ID": X_IG_App_ID,
    "Referer": base_url,
    "Cookie": cookie,
  },
  baseUrl: base_url,
  apiUrl: api_url,
  docId: IG_GRAPHQL_DOC_ID,
  batchSizeMultiplier: 2,
};