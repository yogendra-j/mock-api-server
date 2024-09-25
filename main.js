const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const bodyParser = require("body-parser");

const app = express();
const cache = new NodeCache();

// Target API URL
const API_URL = "https://your-staging-api-url.com";

app.use(bodyParser.json());

app.use(async (req, res) => {
  const fullUrl = `${API_URL}${req.url}`;
  const cacheKey = `${req.method}:${req.url}`;

  try {
    if (req.method === "GET") {
      const cachedResponse = cache.get(cacheKey);
      if (cachedResponse) {
        console.log("Cache hit:", cacheKey);
        return res.json(cachedResponse);
      }
    }

    const response = await axios({
      method: req.method,
      url: fullUrl,
      data: req.body,
      headers: req.headers,
    });

    if (req.method === "GET") {
      console.log("Caching:", cacheKey);
      cache.set(cacheKey, response.data);
    } else if (req.method === "POST" || req.method === "PATCH") {
      console.log("Clearing cache");
      cache.flushAll();
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
