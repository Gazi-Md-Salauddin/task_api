# Books to Scrape — Stage 0

## Target Classification

- **Target:** Books to Scrape
- **Why this target is appropriate:** The [ToScrape landing page](https://toscrape.com/) describes Books to Scrape as a fictional bookstore that wants to be scraped and a safe place for beginners to learn web scraping and developers to validate scraping technologies.
- **Scope:** The first 3 catalogue pages only.
- **What data will be collected:** Book title, price, availability, star rating, and product-page URL.
- **Actual robots.txt result:** A request to `https://books.toscrape.com/robots.txt` returned **HTTP 404 Not Found**. No robots.txt directives were returned.
- **Why scraping this target is appropriate for this assignment:** The target is explicitly presented by its operator as a safe, public practice sandbox for learning and validating scraping. This assignment will stay within the first three catalogue pages.

I will not reuse this code on another site without checking its rules and terms first.

## Stage 1 — Fetch and Cache

Run the scraper from the repository root:

```sh
node scraper/src/index.js
```

The first run requests catalogue page 1 and saves the HTML to `scraper/cache/catalogue-page-1.html`, reporting `FETCH` and the response size. Later runs use the cached file and report `CACHE HIT` and its size without making a network request. The fetch has a 10-second timeout and accepts only HTTP 200 responses.
