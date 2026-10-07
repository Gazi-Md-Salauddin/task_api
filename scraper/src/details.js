const path = require("node:path");
const { createHash } = require("node:crypto");
const cheerio = require("cheerio");

const REQUEST_INTERVAL_MS = 500;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function extractRawRecord(html, { product_url, source_page, fetched_at }) {
  const $ = cheerio.load(html);
  const product = $(".product_main");
  const title = product.find("h1").first().text().trim();
  const price = product.find(".price_color").first().text().trim();
  const availability = product.find(".availability").first().text();
  const ratingClasses =
    product.find(".star-rating").first().attr("class")?.split(/\s+/) ?? [];
  const rating = ratingClasses.find((className) => className !== "star-rating");
  const description = $("#product_description").next("p").text().trim() || null;

  if (!title || !price || !availability.trim() || !rating) {
    throw new Error(`Required product information missing on ${product_url}`);
  }

  return {
    title,
    product_url,
    price_text: price,
    availability_text: availability.replace(/\s+/g, " ").trim(),
    rating_text: rating,
    description,
    source_page,
    fetched_at,
  };
}

async function fetchBookDetails({ books, cacheDir, fetchCache }) {
  const records = [];
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

  for (const book of books) {
    const cacheKey = createHash("sha256").update(book.url).digest("hex");
    const cacheFile = path.join(cacheDir, `${cacheKey}.html`);
    const html = await fetchCache(book.url, cacheFile, {
      beforeNetworkRequest: paceNetworkRequest,
      retryOnce: true,
    });
    const fetchedAt = new Date().toISOString();
    records.push(
      extractRawRecord(html, {
        product_url: book.url,
        source_page: book.source_page,
        fetched_at: fetchedAt,
      }),
    );
  }

  return records;
}

module.exports = { extractRawRecord, fetchBookDetails };
