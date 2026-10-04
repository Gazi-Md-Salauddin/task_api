# Task API

## Project overview

A Task CRUD REST API backed by PostgreSQL. Docker Compose runs the API and database together, so a clean clone can be started with one command without separately installing PostgreSQL.

## Tech stack

- Node.js
- Express
- PostgreSQL
- `pg` (Node.js PostgreSQL client)
- Docker
- Docker Compose

## Prerequisites

- Git
- Docker Desktop, running with Docker Compose available

Node.js and PostgreSQL do not need to be installed on the host to use the Docker Compose workflow.

## Run with Docker Compose

From the repository directory, start the API and PostgreSQL database:

```bash
docker compose up --build
```

The API is available at `http://localhost:5000`. Compose waits for PostgreSQL to pass its healthcheck before starting the API.

Stop the services while preserving the database:

```bash
docker compose down
```

PostgreSQL data is stored in the named `taskdata` volume and survives container removal and restart. **Warning:** `docker compose down -v` also removes the named volume and permanently deletes its database data.

After cloning the repository, run `docker compose up --build`; no PostgreSQL installation or committed `.env` file is needed.

## Environment variables

`.env.example` documents the connection string for running the API directly on the host:

```env
DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks
```

For local non-Docker development, copy `.env.example` to `.env` and provide a running local PostgreSQL database with those connection details. The `.env` file is ignored by Git and should not be committed.

Docker Compose supplies its own connection string to the API container:

```env
DATABASE_URL=postgres://postgres:dev@db:5432/tasks
```

Here, `db` is the PostgreSQL service hostname on the Compose network; `localhost` inside the API container would refer to the API container itself. The `dev` password is a local development default, not a production secret.

## API base URL

The local API base URL is:

```text
http://localhost:5000
```

Swagger UI is available at `http://localhost:5000/docs`.

## API endpoints

| Method | Path | Purpose | Request body | Success | Important errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/tasks` | List tasks | None | `200 OK`, JSON array | — |
| GET | `/tasks/:id` | Get one task | None | `200 OK`, task JSON | `404 Not Found` |
| POST | `/tasks` | Create a task | JSON `title` required; `done` optional (defaults to `false`) | `201 Created`, task JSON | `400 Bad Request` for missing/blank title or invalid `done` |
| PUT | `/tasks/:id` | Update task fields | JSON with optional `title` and/or `done`; omitted fields stay unchanged | `200 OK`, task JSON | `400 Bad Request` for invalid task data; `404 Not Found` |
| DELETE | `/tasks/:id` | Delete a task | None | `204 No Content`, empty body | `404 Not Found` |

Example create body:

```json
{
  "title": "Learn Docker",
  "done": false
}
```

Example partial update body:

```json
{
  "done": true
}
```

Tasks have an integer `id`, string `title`, and boolean `done`. A missing task returns `404` with `{"error":"Task not found"}`. A missing or blank create title returns `400` with `{"error":"Title is required"}`.

## CRUD examples

These examples use `curl` and the local API port:

List tasks:

```bash
curl http://localhost:5000/tasks
```

Get task with ID 1:

```bash
curl http://localhost:5000/tasks/1
```

Create a task:

```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Docker","done":false}'
```

Update task with ID 1:

```bash
curl -X PUT http://localhost:5000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Docker Compose","done":true}'
```

Delete task with ID 1:

```bash
curl -X DELETE http://localhost:5000/tasks/1
```

## Database behavior

On startup, the API creates the PostgreSQL `tasks` table if it does not exist. It inserts exactly three example tasks only when the table is empty, so restarts do not duplicate seed records. PostgreSQL data is persisted in the Compose named volume `taskdata`.

## Project structure

```text
task_api/
├── server.js
├── database/
│   └── tasksRepository.js
├── Dockerfile
├── compose.yaml
├── .dockerignore
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

## Troubleshooting

- **Docker Desktop or daemon is not running:** Start Docker Desktop and wait for the engine to become available, then run `docker compose up --build` again.
- **Port 5000 is already in use:** Stop the process using that port, then restart the stack. The API is configured to listen on host port `5000`.
- **PostgreSQL connection or startup issue:** Check Docker Desktop is running and allow the database healthcheck to pass; Compose starts the API only after the database reports healthy.
- **Stop or restart the stack:** Use `docker compose down` to stop services without deleting data, then `docker compose up --build` to start them again. Do not use `docker compose down -v` unless you intend to delete the `taskdata` database volume.
