const supabase = require("../lib/supabase");

async function requireAuth(req, res, next) {
  if (!supabase) {
    return res.status(500).json({
      error: "Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    });
  }

  const authHeader = req.headers.authorization || "";
  const isBearer = authHeader.startsWith("Bearer ");
  const token = isBearer ? authHeader.slice("Bearer ".length).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.userId = data.user.id;
  req.user = data.user;
  return next();
}

module.exports = { requireAuth };
