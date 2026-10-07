const fs = require("node:fs/promises");
const path = require("node:path");
const { z } = require("zod");

const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Must be an absolute HTTPS URL",
  });

const bookRecordSchema = z.object({
  title: z.string(),
  product_url: httpsUrlSchema,
  price_text: z.string(),
  price_gbp: z.number(),
  availability_text: z.string(),
  rating_text: z.string(),
  description: z.string().nullable(),
  source_page: httpsUrlSchema,
  fetched_at: z.string().datetime(),
});

function normalizePrice(priceText) {
  const match = /^£\s*(\d+(?:\.\d{1,2})?)$/.exec(priceText.trim());
  return match ? Number(match[1]) : Number.NaN;
}

async function validateAndStoreRecords(records, outputDir) {
  const validRecords = new Map();
  const invalidRecords = [];

  for (const record of records) {
    const candidate = {
      ...record,
      price_gbp: normalizePrice(record.price_text),
    };
    const result = bookRecordSchema.safeParse(candidate);

    if (!result.success) {
      invalidRecords.push({
        product_url: record.product_url,
        record: candidate,
        errors: result.error.issues.map(({ path: issuePath, message }) => ({
          path: issuePath.join("."),
          message,
        })),
      });
      continue;
    }

    if (!validRecords.has(result.data.product_url)) {
      validRecords.set(result.data.product_url, result.data);
    }
  }

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "books.json"),
    `${JSON.stringify([...validRecords.values()], null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(outputDir, "errors.json"),
    `${JSON.stringify(invalidRecords, null, 2)}\n`,
  );

  return {
    validRecords: validRecords.size,
    invalidRecords: invalidRecords.length,
    uniqueRecords: validRecords.size,
  };
}

module.exports = { bookRecordSchema, normalizePrice, validateAndStoreRecords };
