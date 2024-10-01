const express = require("express");
const axios = require("axios");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/enriched-urls", async (req, res) => {
  try {
    const urls = await fetchUrls();
    const enrichedData = await fetchEnrichedData();
    const enrichedUrls = enrichUrls(urls, enrichedData);

    res.json(enrichedUrls);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

function normalizeDomain(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const parts = hostname.split(".");

    return parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  } catch (error) {
    console.error("Invalid URL:", url, error);
    return null;
  }
}

async function fetchUrls() {
  const response = await axios.get(
    "https://cdn.taboola.com/mobile-config/home-assignment/messages.json"
  );
  const urlsSet = new Set();

  return response.data.flatMap((item) => {
    return item._source.message
      .map((linkItem) => {
        const linkUrl = linkItem.link?.url;
        if (!linkUrl) {
          console.warn("Link URL is missing for:", linkItem);
          return null;
        }

        try {
          const url = new URL(linkUrl);
          const redirectUrl = decodeURIComponent(
            url.searchParams.get("redirect")
          );
          if (urlsSet.has(redirectUrl)) {
            return null;
          }
          urlsSet.add(redirectUrl);
          return redirectUrl;
        } catch (error) {
          console.error("Error creating URL for:", linkUrl, error);
          return null;
        }
      })
      .filter(Boolean);
  });
}

async function fetchEnrichedData() {
  const response = await axios.get(
    "https://cdn.taboola.com/mobile-config/home-assignment/data.json"
  );
  return response.data;
}

function enrichUrls(urls, enrichedData) {
  const normalizedUrls = urls.map(normalizeDomain);
  const normalizedEnrichedData = enrichedData.map((item) => ({
    ...item,
    normalizedUrl: normalizeDomain(item.url),
  }));

  return normalizedUrls.map((url) => {
    const enrichment =
      normalizedEnrichedData.find((item) => item.normalizedUrl === url) || null;

    return enrichment == null ? null : { ...enrichment };
  }).filter(Boolean);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
