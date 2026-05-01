const BASE = "https://api.themoviedb.org/3";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(503).json({ error: "TMDB_API_KEY not set in Vercel env vars" });

  const path  = req.query.path || "/movie/popular";
  const query = new URLSearchParams({ ...req.query, api_key: key, language: "en-US" });
  query.delete("path");

  try {
    const upstream = await fetch(`${BASE}${path}?${query}`);
    const data     = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
