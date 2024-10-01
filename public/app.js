document.addEventListener("DOMContentLoaded", async function () {
  const contentDiv = document.getElementById("contentDiv");
  try {
    const response = await fetch("/api/enriched-urls");
    const enrichedUrls = await response.json();

    const groupedByCountry = enrichedUrls.reduce((countryMap, item) => {
      const country = item.country || "Unknown";

      if (!countryMap[country]) {
        countryMap[country] = [];
      }
      countryMap[country].push(item);

      return countryMap;
    }, {});

    const sortedCountries = Object.keys(groupedByCountry).sort();

    sortedCountries.forEach((country) => {
      groupedByCountry[country].sort((a, b) => b.est_emp - a.est_emp);

      const countryDiv = document.createElement("div");
      countryDiv.className = "country-group";

      const countryTitle = document.createElement("h2");
      countryTitle.className = "country-title";
      countryTitle.textContent = country;
      countryDiv.appendChild(countryTitle);

      const urlList = document.createElement("ul");
      urlList.className = "url-list";

      groupedByCountry[country].forEach((item) => {
        const listItem = document.createElement("li");
        listItem.className = "url-item";

        const name = item.name || "No name available";
        const employees =
          item.est_emp > 0
            ? `${item.est_emp} employees`
            : "No employee data available";
        const industry = item.industry || "No industry data available";
        const annualRev =
          item.annual_rev >= 0
            ? `$${item.annual_rev}`
            : "No revenue data available";
        const countryInfo = item.country || "No country data available";

        listItem.textContent = `${name} (${employees}) - ${item.url} | Industry: ${industry} | Annual Revenue: ${annualRev} | Country: ${countryInfo}`;
        urlList.appendChild(listItem);
      });

      countryDiv.appendChild(urlList);
      contentDiv.appendChild(countryDiv);
    });
  } catch (error) {
    contentDiv.textContent = "Error loading data.";
    console.error("Error fetching data:", error);
  }
});
