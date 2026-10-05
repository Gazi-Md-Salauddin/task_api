const express = require("express");
const swaggerUi = require("swagger-ui-express");
const path = require("node:path");
const fs = require("node:fs");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const tasksRepository = require("../database/tasksRepository");
const authRoutes = require("./routes/authRoutes");
const gateRoutes = require("./routes/gateRoutes");

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/", gateRoutes);

const PORT = 5000;

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Task API",
    version: "1.0.0",
    description: "A simple CRUD Task API",
  },
  servers: [
    {
      url: "http://localhost:5000",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      AuthCredentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 1,
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
          },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          email: {
            type: "string",
            format: "email",
          },
          created_at: {
            type: "string",
            format: "date-time",
          },
        },
      },
      SignupResponse: {
        type: "object",
        properties: {
          user: {
            $ref: "#/components/schemas/UserProfile",
          },
        },
      },
      LoginResponse: {
        type: "object",
        required: ["access_token", "refresh_token", "user"],
        properties: {
          access_token: {
            type: "string",
          },
          refresh_token: {
            type: "string",
          },
          user: {
            $ref: "#/components/schemas/UserProfile",
          },
        },
      },
      DashboardResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
          user: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              email: {
                type: "string",
                format: "email",
              },
            },
          },
        },
      },
      PublicInfoResponse: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            example: "Welcome stranger! This info is public.",
          },
        },
      },
    },
  },
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthCredentials",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Account created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SignupResponse",
                },
              },
            },
          },
          400: {
            description: "Email or password is missing or signup was rejected",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          502: {
            description: "Authentication service unavailable",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AuthCredentials",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginResponse",
                },
              },
            },
          },
          400: {
            description: "Email or password is missing",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          401: {
            description: "Invalid login credentials",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          502: {
            description: "Authentication service unavailable",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        security: [{ bearerAuth: [] }],
        responses: {
          204: {
            description: "Logged out successfully",
          },
          401: {
            description: "Missing or invalid access token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          502: {
            description: "Logout failed",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/protected/profile": {
      get: {
        tags: ["Protected"],
        summary: "Get the authenticated user's profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Verified user profile",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UserProfile",
                },
              },
            },
          },
          401: {
            description: "Missing or invalid access token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/protected/dashboard": {
      get: {
        tags: ["Protected"],
        summary: "Get the authenticated user's dashboard",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Protected dashboard information",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DashboardResponse",
                },
              },
            },
          },
          401: {
            description: "Missing or invalid access token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/public/info": {
      get: {
        tags: ["Public"],
        summary: "Get public information",
        responses: {
          200: {
            description: "Public information",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PublicInfoResponse",
                },
              },
            },
          },
        },
      },
    },
    "/tasks": {
      get: {
        summary: "Get all tasks",
        responses: {
          200: {
            description: "List of tasks",
          },
        },
      },

      post: {
        summary: "Create a new task",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Task created",
          },
          400: {
            description: "Invalid title",
          },
        },
      },
    },

    "/tasks/{id}": {
      get: {
        summary: "Get a task by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        responses: {
          200: {
            description: "Task found",
          },
          404: {
            description: "Task not found",
          },
        },
      },

      put: {
        summary: "Update a task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  done: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Task updated",
          },
          400: {
            description: "Invalid task data",
          },
          404: {
            description: "Task not found",
          },
        },
      },

      delete: {
        summary: "Delete a task",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        responses: {
          204: {
            description: "Task deleted",
          },
          404: {
            description: "Task not found",
          },
        },
      },
    },
  },
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
    });
});


app.get("/tasks", async (req, res) => {
  const tasks = await tasksRepository.getAll();
  res.json(tasks);
});

app.get("/tasks/:id", async (req, res) => {
  const task = await tasksRepository.getById(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }
  res.json(task);
});


app.post("/tasks", async (req, res) => {
  const { title, done = false } = req.body || {};

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Title is required",
    });
  }

  if (typeof done !== "boolean") {
    return res.status(400).json({
      error: "Invalid task data",
    });
  }

  const task = await tasksRepository.create(title.trim(), done);
  res.status(201).json(task);
});


app.put("/tasks/:id", async (req, res) => {
  const { title, done } = req.body || {};

  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    (title !== undefined && (typeof title !== "string" || title.trim() === "")) ||
    (done !== undefined && typeof done !== "boolean")
  ) {
    return res.status(400).json({
      error: "Invalid task data",
    });
  }

  const id = req.params.id;
  const existingTask = await tasksRepository.getById(id);
  if (!existingTask) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  const updatedTask = await tasksRepository.updateById(
    id,
    title !== undefined ? title.trim() : existingTask.title,
    done !== undefined ? done : existingTask.done
  );
  if (!updatedTask) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  res.json(updatedTask);
});


app.delete("/tasks/:id", async (req, res) => {
  const task = await tasksRepository.deleteById(req.params.id);
  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  res.status(204).send();
});

async function startServer() {
  try {
    await tasksRepository.initialize();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize PostgreSQL:", error);
    process.exitCode = 1;
  }
}

startServer();