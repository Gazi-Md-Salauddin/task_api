const express = require("express");
const swaggerUi = require("swagger-ui-express");
const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const tasksRepository = require("./database/tasksRepository");

const app = express();

app.use(express.json());

const PORT = 5000;

const db = new Database(path.join(__dirname, "tasks.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const taskCount = db.prepare("SELECT COUNT(*) AS count FROM tasks").get().count;
if (taskCount === 0) {
  const seedTask = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  const seedTasks = db.transaction(() => {
    seedTask.run("Learn Node.js", 0);
    seedTask.run("Build Task API", 0);
    seedTask.run("Learn Swagger", 1);
  });

  seedTasks();
}

let tasks = [
  {
    id: 1,
    title: "Learn Node.js",
    done: false,
  },
  {
    id: 2,
    title: "Build Task API",
    done: false,
  },
  {
    id: 3,
    title: "Learn Swagger",
    done: true,
  },
];


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
  paths: {
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


app.get("/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks").all();
  res.json(tasks.map((task) => ({
    ...task,
    done: Boolean(task.done),
  })));
})

app.get("/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);

  if(!task) {
    return res.status(404).json({
      error: "Task not found",
    })
  }
  res.json({
    ...task,
    done: Boolean(task.done),
  });
});


app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({
      error: "Title is required",
    });
  }

  const result = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
    .run(title.trim(), 0);
  const newTask = {
    id: Number(result.lastInsertRowid),
    title: title.trim(),
    done: false,
  };

  res.status(201).json(newTask);
})


app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if(!task) {
    return res.status(404).json({
      error: `Task ${id} not found`,
    });
  }

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
    })
  }

  const updatedTask = {
    id: task.id,
    title: title !== undefined ? title.trim() : task.title,
    done: done !== undefined ? done : Boolean(task.done),
  };

  db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?")
    .run(updatedTask.title, Number(updatedTask.done), id);

  res.json(updatedTask);
})


app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  if (result.changes === 0) {
    return res.status(404).json({
      error: `Task ${id} not found`,
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