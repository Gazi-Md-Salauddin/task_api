# Task API

A beginner-friendly CRUD REST API for tasks, built with Node.js, Express, and SQLite. You can create, list, retrieve, update, and delete tasks through the API.

Each task has an automatically generated `id`, a `title`, and a `done` status.

## Database setup

The existing CRUD API routes continue to use SQLite in `tasks.db`. During the PostgreSQL setup stage, the application also connects to PostgreSQL using `DATABASE_URL`, creates its `tasks` table if needed, and inserts three example rows only when that table is empty. The API routes are not migrated to PostgreSQL in this stage.

Copy `.env.example` to `.env` for local development. The default connection string is:

```text
DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks
```

PostgreSQL must be running before starting the application.

## Why SQLite for the current API routes?

SQLite is a good fit for this project because it:

- Stores the database in a single file.
- Requires minimal setup.
- Does not need a separate database server.
- Keeps task data when the application restarts.

The SQLite database file is `tasks.db` in the project directory. When the application starts, it automatically creates the file if it does not exist and creates the `tasks` table if needed.

The A2 SQLite table retains its existing behavior: it inserts three example tasks only when the SQLite `tasks` table is empty. Restarting the server does not insert duplicate SQLite seed tasks.

## Installation

From the project directory, install the dependencies:

```bash
npm install
```

## Start the server

```bash
node server.js
```

The API runs at `http://localhost:5000`.

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get one task by ID |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

### Create a task

Send a JSON body with a non-empty title:

```json
{
  "title": "Buy milk"
}
```

A successful create returns the task, including its database-generated ID:

```json
{
  "id": 4,
  "title": "Buy milk",
  "done": false
}
```

## Example SQL query

The update endpoint uses a parameterized SQL query:

```sql
UPDATE tasks SET title = ?, done = ? WHERE id = ?
```

The `?` placeholders are bound to the new title, completion status, and task ID. This updates only the task with the specified ID without inserting user-provided values directly into the SQL statement.

## API documentation

Swagger UI is available at `http://localhost:5000/docs`.

![Swagger UI](screenshot/swagger.png)

## Database screenshot

_Placeholder: add a screenshot of the `tasks` table opened in DB Browser for SQLite when available._
