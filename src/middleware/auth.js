const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
