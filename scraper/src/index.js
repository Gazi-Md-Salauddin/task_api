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
  {
    beforeNetworkRequest,
    onEvent,
    retryOnce = false,
    retryDelayMs = 1_000,
  } = {},
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
    if (onEvent) {
      onEvent({ type: "cache-hit" });
    }
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
      if (onEvent) {
        onEvent({ type: "page-fetched" });
      }
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

async function runScraper() {
  const { discoverCatalogue } = require("./discover");
  const { fetchBookDetails } = require("./details");
  const { validateAndStoreRecords } = require("./store");
  const outputDir = path.join(__dirname, "..", "output");
  const startTime = new Date();
  const stats = {
    pages_fetched: 0,
    cache_hits: 0,
    valid_records: 0,
    invalid_records: 0,
    failed_pages: 0,
  };
  const onEvent = ({ type }) => {
    if (type === "page-fetched") {
      stats.pages_fetched += 1;
    } else if (type === "cache-hit") {
      stats.cache_hits += 1;
    }
  };

  try {
    const { cataloguePages, books } = await discoverCatalogue({
      startUrl: CATALOGUE_PAGE_1_URL,
      cacheDir: path.dirname(CATALOGUE_PAGE_1_CACHE),
      fetchCache: fetchAndCache,
      onEvent,
    });
    console.log(`catalogue_pages=${cataloguePages.length}`);
    console.log(`discovered=${books.length}`);
    console.log(`unique_urls=${new Set(books.map((book) => book.url)).size}`);

    const booksToProcess = [...books];
    if (process.env.TEST_FAILURE === "true") {
      booksToProcess.push({
        url: "http://127.0.0.1:1/stage5-test-book",
        source_page: CATALOGUE_PAGE_1_URL,
      });
    }

    const { records: rawRecords, failedPages } = await fetchBookDetails({
      books: booksToProcess,
      cacheDir: path.join(__dirname, "..", "cache", "detail-pages"),
      fetchCache: fetchAndCache,
      onEvent,
    });
    stats.failed_pages = failedPages;
    console.log(`detail_pages=${rawRecords.length}`);

    if (rawRecords.length > 0) {
      console.log(JSON.stringify(rawRecords[0], null, 2));
    }

    const summary = await validateAndStoreRecords(rawRecords, outputDir);
    stats.valid_records = summary.validRecords;
    stats.invalid_records = summary.invalidRecords;
    console.log(`valid_records=${summary.validRecords}`);
    console.log(`invalid_records=${summary.invalidRecords}`);
    console.log(`unique_records=${summary.uniqueRecords}`);
  } finally {
    const report = {
      start_time: startTime.toISOString(),
      duration: Date.now() - startTime.getTime(),
      ...stats,
    };
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, "run-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  }
}

if (require.main === module) {
  runScraper().catch((error) => {
    console.error(`Scraper run failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { fetchAndCache, runScraper };
