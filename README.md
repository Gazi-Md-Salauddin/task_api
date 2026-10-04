# Task API

A beginner-friendly CRUD REST API for tasks, built with Node.js, Express, and PostgreSQL. You can create, list, retrieve, update, and delete tasks through the API.

Each task has an automatically generated `id`, a `title`, and a `done` status.

## Database setup

The application connects to PostgreSQL using `DATABASE_URL`, creates its `tasks` table if needed, and inserts three example rows only when that table is empty. All task endpoints use PostgreSQL.

Copy `.env.example` to `.env` for local development. The default connection string is:

```text
DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks
```

PostgreSQL must be running before starting the application.

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

The update endpoint uses a parameterized PostgreSQL query:

```sql
UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *
```

The placeholders are bound to the new title, completion status, and task ID. User-provided values are not inserted directly into the SQL statement.

## API documentation

Swagger UI is available at `http://localhost:5000/docs`.

![Swagger UI](screenshot/swagger.png)

## Database screenshot

_Placeholder: add a screenshot of the PostgreSQL `tasks` table when available._
