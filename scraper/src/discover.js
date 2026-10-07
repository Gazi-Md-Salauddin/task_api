const path = require("node:path");
const cheerio = require("cheerio");

const REQUEST_INTERVAL_MS = 500;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function discoverCatalogue({
  startUrl,
  cacheDir,
  fetchCache,
  pageLimit = 3,
}) {
  const cataloguePages = [];
  const booksByUrl = new Map();
  let lastRequestStartedAt;

  async function paceNetworkRequest() {
    if (lastRequestStartedAt !== undefined) {
      const elapsed = Date.now() - lastRequestStartedAt;
      if (elapsed < REQUEST_INTERVAL_MS) {
        await wait(REQUEST_INTERVAL_MS - elapsed);
      }
    }
    lastRequestStartedAt = Date.now();
  }

  let pageUrl = startUrl;
  while (cataloguePages.length < pageLimit) {
    const pageNumber = cataloguePages.length + 1;
    const cacheFile = path.join(cacheDir, `catalogue-page-${pageNumber}.html`);
    const html = await fetchCache(pageUrl, cacheFile, {
      beforeNetworkRequest: paceNetworkRequest,
    });
    const $ = cheerio.load(html);

    cataloguePages.push(pageUrl);
    $(".product_pod h3 a").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) {
        throw new Error(`Book link missing href on ${pageUrl}`);
      }

      const url = new URL(href, pageUrl).href;
      if (!booksByUrl.has(url)) {
        booksByUrl.set(url, { url, source_page: pageUrl });
      }
    });

    if (cataloguePages.length < pageLimit) {
      const nextHref = $("li.next a").attr("href");
      if (!nextHref) {
        throw new Error(`Next catalogue link missing on ${pageUrl}`);
      }
      pageUrl = new URL(nextHref, pageUrl).href;
    }
  }

  return { cataloguePages, books: [...booksByUrl.values()] };
}

module.exports = { discoverCatalogue };
