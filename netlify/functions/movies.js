const BASE = "https://api.themoviedb.org/3";
const KEY  = process.env.TMDB_API_KEY;
const CORS = { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "*" };

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (!KEY) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "TMDB_API_KEY not set in Netlify env vars" }) };

  const path  = event.queryStringParameters?.path || "/movie/popular";
  const query = new URLSearchParams(event.queryStringParameters || {});
  query.delete("path");
  query.set("api_key", KEY);
  query.set("language", "en-US");

  try {
    const res  = await fetch(`${BASE}${path}?${query}`);
    const data = await res.json();
    return { statusCode: res.status, headers: CORS, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
