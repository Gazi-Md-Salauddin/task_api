# Task API

## Project Overview

An Express.js API that uses Supabase Auth for signup, login, access-token verification, and logout. It includes reusable authentication middleware, protected profile and dashboard routes, public information, Swagger documentation, and the existing PostgreSQL-backed task CRUD API.

## Features

- Supabase Auth signup and password login
- Access-token verification through Supabase
- Reusable middleware for protected routes
- Protected profile and dashboard endpoints
- Protected logout endpoint
- Public information endpoint
- Swagger UI with Bearer authentication support
- PostgreSQL-backed task CRUD endpoints

## Tech Stack

- Node.js (22 or later)
- Express.js
- Supabase JavaScript client (`@supabase/supabase-js`)
- PostgreSQL and `pg`
- Swagger UI Express and OpenAPI 3.0

## Prerequisites

- Node.js 22 or later and npm
- A running PostgreSQL database
- A Supabase project URL and its public anon key

## Environment Variables

Copy `.env.example` to `.env` and set the values for your environment:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by the task repository. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_KEY` | Supabase public anon key; do not use a `service_role` key. |
| `PORT` | Present in `.env.example`, but the current server listens on port `5000` and does not read this variable. |

The example database URL expects PostgreSQL on `localhost:5432`, with a database named `tasks`. Replace example values as needed. Do not put real credentials in source code. `.env` is ignored by Git and must not be committed.

## Installation

```bash
npm ci
```

## Run Locally

Start PostgreSQL and configure `.env`, then run the existing start script:

```bash
npm start
```

The server listens at `http://localhost:5000`. On startup, it creates the `tasks` table if needed and inserts three sample tasks only when the table is empty. The app requires the database to be available during startup.

## API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/signup` | No | Create a Supabase Auth account. Requires `email` and `password`. |
| POST | `/auth/login` | No | Log in with email and password; returns access and refresh tokens. |
| POST | `/auth/logout` | Bearer token | Verify the caller and sign out. Returns `204` on success. |
| GET | `/protected/profile` | Bearer token | Return the verified user's ID, email, and account creation date. |
| GET | `/protected/dashboard` | Bearer token | Return the protected dashboard response for the verified user. |
| GET | `/public/info` | No | Return the public welcome message. |
| GET | `/tasks` | No | List tasks. |
| GET | `/tasks/:id` | No | Get a task by ID. |
| POST | `/tasks` | No | Create a task with a required title and optional `done` value. |
| PUT | `/tasks/:id` | No | Update a task's title and/or `done` value. |
| DELETE | `/tasks/:id` | No | Delete a task. |

## Authentication

After a successful login, send the returned access token on protected requests using:

```http
Authorization: Bearer <access_token>
```

The reusable middleware verifies the token with Supabase before the protected handler runs. Missing or invalid tokens receive `401 Unauthorized`.

Signup and login request bodies are JSON with `email` and `password` fields. Supabase handles password storage and authentication.

## Swagger Documentation

Open [http://localhost:5000/docs](http://localhost:5000/docs). Select **Authorize** and enter the access token; Swagger UI uses the configured HTTP Bearer scheme when sending protected requests. The document applies authentication only to logout, profile, and dashboard operations.

## Project Structure

```text
task_api/
├── database/
│   └── tasksRepository.js
├── src/
│   ├── config/
│   │   └── supabase.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── gateRoutes.js
│   └── server.js
├── .env.example
├── .gitignore
├── compose.yaml
├── Dockerfile
├── package.json
├── package-lock.json
└── README.md
```

The OpenAPI specification is defined in `src/server.js`; `src/config/supabase.js` exports the shared Supabase client, and `src/middleware/authMiddleware.js` verifies protected requests.

## Testing

Stages 1–5 were checked with in-process HTTP requests using stubbed Supabase responses. Checks covered auth input/success/error responses, missing and invalid tokens, profile and dashboard protection, logout success and failure, and Swagger UI loading plus documented route/security metadata. Syntax and diff checks also passed.

These checks did not use a live Supabase account or real access token. The `npm test` script is currently a placeholder and does not run an automated test suite.

## Security Notes

- Supabase handles passwords; the application does not store or manually hash them.
- Access tokens are verified with Supabase before protected route handlers run.
- Protected routes share the reusable authentication middleware.
- Keep Supabase credentials in environment variables and use only the public anon key.
- Never commit `.env`; it is listed in `.gitignore`.
