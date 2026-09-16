const express = require("express");

const app = express();

const PORT = 5000;

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
  res.json(tasks)
})

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id)

  const task = tasks.find((task) => task.id === id)

  if(!task) {
    return res.status(404).json({
      error: `task ${id} not found`,
    })
  }
  res.json(task);
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});