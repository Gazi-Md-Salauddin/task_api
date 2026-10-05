const supabase = require("../config/supabase");

async function authMiddleware(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({ error: "Access token required" });
  }

  let user;

  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    user = data?.user;

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = user;
  return next();
}

module.exports = authMiddleware;