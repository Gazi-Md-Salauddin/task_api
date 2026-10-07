# Books to Scrape Pipeline

## Project Overview

A polite JavaScript scraping pipeline for the public Books to Scrape practice site. It discovers books from the first three catalogue pages, caches responses, extracts and validates book records, then writes the data and run metrics to JSON files.

## Target Classification

- **Target:** Books to Scrape (`https://books.toscrape.com/`).
- **Why it is appropriate:** The [ToScrape landing page](https://toscrape.com/) describes it as a fictional bookstore intended as a safe practice site for learning and validating scraping.
- **Scope:** The first 3 catalogue pages only.
- **Data collected:** Book title, product URL, original price text, numeric GBP price, availability, star rating, description when present, source catalogue page, and fetch timestamp.
- **robots.txt result:** The single request to `https://books.toscrape.com/robots.txt` returned **HTTP 404 Not Found**; no robots.txt directives were returned.

I will not reuse this code on another site without checking its rules and terms first.

## Tech Stack

- Node.js 20+
- JavaScript (CommonJS)
- Node.js `fetch`
- Cheerio for HTML parsing
- Zod for record validation

## Installation

The `package.json` and lockfile are in the repository root. From that directory, install dependencies with:

```sh
npm install
```

## Run

From the repository root, run:

```sh
node scraper/src/index.js
```

The normal run processes the first three catalogue pages and stores the 60 discovered unique books.

## Pipeline

`fetch → extract → normalize → validate → store → report`

Catalogue links are discovered, product pages are fetched or read from cache, raw records are extracted, prices are normalized, records are validated and deduplicated, then JSON outputs and the run report are written.

## Record Schema

Every valid book record contains:

| Field | Description |
| --- | --- |
| `title` | Book title |
| `product_url` | Canonical absolute HTTPS product URL; record identity |
| `price_text` | Original price text from the page |
| `price_gbp` | Price as a JavaScript number in GBP |
| `availability_text` | Raw availability wording |
| `rating_text` | Star-rating label |
| `description` | Description text, or `null` when absent |
| `source_page` | Catalogue page where the product link was found |
| `fetched_at` | ISO datetime when the detail page was read |

## Politeness Rules

- Sends the identifying User-Agent `FlyRankInternshipA9/1.0 (+https://github.com/Gazi-Md-Salauddin)`.
- Waits at least 500 ms between real requests; cached reads do not trigger the delay.
- Uses a 10-second request timeout.
- Checks HTTP status before accepting and caching a response; only HTTP 200 is successful.
- Caches catalogue and product HTML so later runs avoid repeat network requests.
- Retries a timeout or HTTP 5xx response once after a delay.
- Does not retry HTTP 403 or 404 responses.

## Validation

Every extracted record is normalized and validated against the Zod book schema before it can be stored. Valid records go to `output/books.json`; invalid records, along with the failing record and validation messages, go to `output/errors.json`.

## Idempotency

Records are deduplicated by `product_url`, and the output file is regenerated from the current run. Re-running with the same cached catalogue and detail pages does not append duplicates; the normal scope remains 60 unique records.

## Failure Handling

Each detail page is processed independently. A failed fetch or extraction is logged and skipped so remaining books continue. Timeout and HTTP 5xx errors receive one retry; HTTP 403 and 404 do not. Failed detail pages are counted in `output/run-report.json`. Setting `TEST_FAILURE=true` adds one localhost-only fake URL to exercise this behavior without contacting the target site.

## Output Files

- `output/books.json` — validated, unique book records.
- `output/errors.json` — invalid records and validation issues (an empty array when none fail validation).
- `output/run-report.json` — metrics and duration for the latest run.
- `cache/` — cached catalogue and product-page HTML.

The scraper's `.gitignore` excludes `cache/` and `node_modules/`, so cached HTML and scraper-local dependencies are not committed.

## Sample Run Report

This is a real report from a successful normal run:

```json
{
  "start_time": "2026-10-07T05:54:47.113Z",
  "duration": 217,
  "pages_fetched": 0,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

## Honest Limitation

The scraper intentionally covers only the first three catalogue pages; it does not represent the full Books to Scrape catalogue.

## Why No Browser?

The required catalogue and book information is present in the HTML returned by the server. The core assignment can therefore fetch and parse the pages directly, without browser automation or JavaScript-rendered content.

## Ethics Note

Prefer an official API when one is available. Do not bypass logins, paywalls, or blocks. Collect only the data needed for the task, and check each site's rules and terms before scraping.
