const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initialize() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT false
      )
    `);

    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM tasks");
    if (rows[0].count === 0) {
      await pool.query(
        `INSERT INTO tasks (title, done)
         VALUES
           ($1, false),
           ($2, false),
           ($3, false)`,
        ["Learn Docker", "Connect PostgreSQL", "Build Task API"]
      );
    }
  } catch (error) {
    await pool.end();
    throw error;
  }
}

module.exports = { initialize };
