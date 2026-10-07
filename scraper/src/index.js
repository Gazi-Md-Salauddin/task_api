const fs = require("node:fs/promises");
const path = require("node:path");

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

async function fetchAndCache(url, cacheFilePath) {
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

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status !== 200) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }

  const content = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
  await fs.writeFile(cacheFilePath, content);

  console.log("FETCH");
  console.log(`Response size: ${content.length} bytes`);
  return content;
}

if (require.main === module) {
  fetchAndCache(CATALOGUE_PAGE_1_URL, CATALOGUE_PAGE_1_CACHE).catch(
    (error) => {
      console.error(`Scrape fetch failed: ${error.message}`);
      process.exitCode = 1;
    },
  );
}

module.exports = { fetchAndCache };
