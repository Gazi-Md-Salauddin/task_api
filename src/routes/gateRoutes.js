const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

router.get("/public/info", (req, res) => {
  res.status(200).json({
    message: "Welcome stranger! This info is public.",
  });
});

router.get("/protected/profile", async (req, res) => {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Access token required",
    });
  }

  const token = match[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;