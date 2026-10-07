const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");

const USER_AGENT =
  "FlyRankInternshipA9/1.0 (+https://github.com/Gazi-Md-Salauddin)";
const REQUEST_TIMEOUT_MS = 10_000;
const CATALOGUE_PAGE_1_URL =
  "https://books.toscrape.com/catalogue/page-1.html";
const CATALOGUE_PAGE_1_CACHE = path.join(
  __dirname,
  "..",
  "cache",
  "catalogue-page-1.html",
);

async function fetchAndCache(
  url,
  cacheFilePath,
  { beforeNetworkRequest, retryOnce = false, retryDelayMs = 1_000 } = {},
) {
  let cachedContent;

  try {
    cachedContent = await fs.readFile(cacheFilePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  if (cachedContent) {
    console.log("CACHE HIT");
    console.log(`Response size: ${cachedContent.length} bytes`);
    return cachedContent;
  }

  let attempt = 0;
  while (true) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    if (beforeNetworkRequest) {
      await beforeNetworkRequest();
    }

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status !== 200) {
        const error = new Error(`Request failed with HTTP ${response.status}`);
        error.status = response.status;
        if (response.status >= 500 && retryOnce && attempt === 0) {
          attempt += 1;
          continue;
        }
        throw error;
      }

      const content = Buffer.from(await response.arrayBuffer());
      await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
      await fs.writeFile(cacheFilePath, content);

      console.log("FETCH");
      console.log(`Response size: ${content.length} bytes`);
      return content;
    } catch (error) {
      const isTimeout =
        error.name === "TimeoutError" || error.name === "AbortError";
      if (!isTimeout || !retryOnce || attempt > 0) {
        throw error;
      }
      attempt += 1;
    }
  }
}

if (require.main === module) {
  const { discoverCatalogue } = require("./discover");

  discoverCatalogue({
    startUrl: CATALOGUE_PAGE_1_URL,
    cacheDir: path.dirname(CATALOGUE_PAGE_1_CACHE),
    fetchCache: fetchAndCache,
  })
    .then(async ({ cataloguePages, books }) => {
      console.log(`catalogue_pages=${cataloguePages.length}`);
      console.log(`discovered=${books.length}`);
      console.log(`unique_urls=${new Set(books.map((book) => book.url)).size}`);
      const { fetchBookDetails } = require("./details");
      const rawRecords = await fetchBookDetails({
        books,
        cacheDir: path.join(__dirname, "..", "cache", "detail-pages"),
        fetchCache: fetchAndCache,
      });
      console.log(JSON.stringify(rawRecords[0], null, 2));
      console.log(`detail_pages=${rawRecords.length}`);
      const { validateAndStoreRecords } = require("./store");
      const summary = await validateAndStoreRecords(
        rawRecords,
        path.join(__dirname, "..", "output"),
      );
      console.log(`valid_records=${summary.validRecords}`);
      console.log(`invalid_records=${summary.invalidRecords}`);
      console.log(`unique_records=${summary.uniqueRecords}`);
    })
    .catch((error) => {
      console.error(`Scrape discovery failed: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { fetchAndCache };
