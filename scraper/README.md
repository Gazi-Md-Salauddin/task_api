# Books to Scrape — Stage 0

## Target Classification

- **Target:** Books to Scrape
- **Why this target is appropriate:** The [ToScrape landing page](https://toscrape.com/) describes Books to Scrape as a fictional bookstore that wants to be scraped and a safe place for beginners to learn web scraping and developers to validate scraping technologies.
- **Scope:** The first 3 catalogue pages only.
- **What data will be collected:** Book title, price, availability, star rating, and product-page URL.
- **Actual robots.txt result:** A request to `https://books.toscrape.com/robots.txt` returned **HTTP 404 Not Found**. No robots.txt directives were returned.
- **Why scraping this target is appropriate for this assignment:** The target is explicitly presented by its operator as a safe, public practice sandbox for learning and validating scraping. This assignment will stay within the first three catalogue pages.

I will not reuse this code on another site without checking its rules and terms first.

## Stage 0 Verification

Run the placeholder entry point with:

```bash
node scraper/src/index.js
```

Confirm it reports that Stage 0 is complete and does not fetch or scrape catalogue pages. Review the target classification and recorded robots.txt status above.
