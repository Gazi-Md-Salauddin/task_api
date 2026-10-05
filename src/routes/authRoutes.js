const express = require("express");
const supabase = require("../config/supabase");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password.trim()) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: "Unable to sign up" });
    }

    return res.status(201).json({ user: data.user });
  } catch {
    return res.status(502).json({ error: "Authentication service unavailable" });
  }
});

router.post("/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password.trim()) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    if (!data.session) {
      return res.status(502).json({ error: "Authentication service unavailable" });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch {
    return res.status(502).json({ error: "Authentication service unavailable" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(502).json({ error: "Unable to log out" });
    }

    return res.status(204).send();
  } catch {
    return res.status(502).json({ error: "Unable to log out" });
  }
});

module.exports = router;