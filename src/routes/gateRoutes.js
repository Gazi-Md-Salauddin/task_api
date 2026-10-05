const express = require("express");

const router = express.Router();

router.get("/public/info", (req, res) => {
  res.status(200).json({
    message: "Welcome stranger! This info is public.",
  });
});

router.get("/protected/profile", (req, res) => {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Access token required",
    });
  }

  return res.status(200).json({
    message: "Token received successfully",
  });
});

module.exports = router;