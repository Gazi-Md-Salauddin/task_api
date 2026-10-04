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

async function getAll() {
  const { rows } = await pool.query("SELECT * FROM tasks");
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return rows[0];
}

async function create(title, done) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (title, done)
     VALUES ($1, $2)
     RETURNING *`,
    [title, done]
  );
  return rows[0];
}

async function updateById(id, title, done) {
  const { rows } = await pool.query(
    `UPDATE tasks
     SET title = $1, done = $2
     WHERE id = $3
     RETURNING *`,
    [title, done, id]
  );
  return rows[0];
}

async function deleteById(id) {
  const { rows } = await pool.query(
    "DELETE FROM tasks WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0];
}

module.exports = {
  initialize,
  getAll,
  getById,
  create,
  updateById,
  deleteById,
};
