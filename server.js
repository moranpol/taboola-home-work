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
    const urlsRes = await axios.get(
      "https://cdn.taboola.com/mobile-config/home-assignment/messages.json"
    );
    const urls = urlsRes.data.flatMap((item) => {
      return item._source.message
        .map((linkItem) => {
          const linkUrl = linkItem.link?.url;
          if (!linkUrl) {
            console.warn("Link URL is missing for:", linkItem);
            return null;
          }

          try {
            const url = new URL(linkUrl);
            return decodeURIComponent(url.searchParams.get("redirect"));
          } catch (error) {
            console.error("Error creating URL for:", linkUrl, error);
            return null;
          }
        })
        .filter(Boolean);
    });

    const enrichedDataRes = await axios.get(
      "https://cdn.taboola.com/mobile-config/home-assignment/data.json"
    );
    const enrichedData = enrichedDataRes.data;
    const enrichedUrls = urls.map((url) => {
      const enrichment = enrichedData.find((item) => item.url === url);
      return { ...enrichment, url };
    });

    res.json(enrichedUrls);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
