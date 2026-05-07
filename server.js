import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers":"*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,HEAD",
};

const DEFAULT_USERS = [
  { user: "Ryder",   role: "owner",       code: process.env.CODE_RYDER   || "82047" },
  { user: "Logan",   role: "slave owner", code: process.env.CODE_LOGAN   || "63914" },
  { user: "Beckham", role: "slave",       code: process.env.CODE_BECKHAM || "39571" },
  { user: "Kolby",   role: "slave",       code: process.env.CODE_KOLBY   || "74286" },
  { user: "Levi",    role: "slave",       code: process.env.CODE_LEVI    || "51839" },
  { user: "Liam",    role: "slave",       code: process.env.CODE_LIAM    || "26473" },
  { user: "Gibson",  role: "slave",       code: process.env.CODE_GIBSON  || "98132" },
];

globalThis.__uwuCodeOverrides = globalThis.__uwuCodeOverrides || {};

function getEffectiveUsers() {
  const overrides = globalThis.__uwuCodeOverrides || {};
  return DEFAULT_USERS.map(u => ({ ...u, code: String(overrides[u.user] || u.code) }));
}

// Bare v3 proxy endpoint — required by UV/bare-mux
app.options("/bare/*", (req, res) => {
  res.set(CORS).status(200).end();
});

app.all("/bare/*", async (req, res) => {
  res.set(CORS);

  const xBareUrl = req.headers["x-bare-url"];

  if ((req.method === "GET" || req.method === "HEAD") && !xBareUrl) {
    return res.json({
      versions: ["v3"], language: "JavaScript", memoryUsage: 0,
      maintainer: {}, project: { name: "uwu-proxy", version: "1.0.0" },
    });
  }

  if (!xBareUrl) {
    return res.status(400).json({ code: "MISSING_BARE_URL", id: "err", message: "X-Bare-Url required" });
  }

  let reqHeaders = {};
  try { reqHeaders = JSON.parse(req.headers["x-bare-headers"] || "{}"); } catch {}
  const fwdHdrs    = JSON.parse(req.headers["x-bare-forward-headers"] || "[]");
  const passHdrs   = JSON.parse(req.headers["x-bare-pass-headers"]    || "[]");
  const passStatus = JSON.parse(req.headers["x-bare-pass-status"]     || "[]");

  for (const h of fwdHdrs) { const v = req.headers[h.toLowerCase()]; if (v) reqHeaders[h] = v; }

  try {
    const fetchOpts = { method: req.method, headers: reqHeaders, redirect: "manual" };

    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      fetchOpts.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(xBareUrl, fetchOpts);
    const resHdrs  = {};
    upstream.headers.forEach((v, k) => { resHdrs[k] = v; });

    for (const h of passHdrs) { const v = upstream.headers.get(h); if (v != null) res.setHeader(h, v); }
    res.setHeader("x-bare-status",      String(upstream.status));
    res.setHeader("x-bare-status-text", upstream.statusText || "OK");
    res.setHeader("x-bare-headers",     JSON.stringify(resHdrs));
    res.setHeader("content-type",       "application/octet-stream");

    const status = passStatus.includes(upstream.status) ? upstream.status : 200;
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(status).send(buf);
  } catch (err) {
    return res.status(500).json({ code: "UNKNOWN", id: "err", message: err.message });
  }
});

// SW at root and UV SW need scope "/" — serve both with the required header
const SW_FILES = {
  "/sw.js":    join(__dirname, "public/sw.js"),
  "/uv/sw.js": join(__dirname, "public/uv/sw.js"),
};
app.get(Object.keys(SW_FILES), (req, res) => {
  res.setHeader("Service-Worker-Allowed", "/");
  res.sendFile(SW_FILES[req.path]);
});

app.options(["/api/auth", "/api/auth-codes"], (req, res) => {
  res.set(CORS).status(200).end();
});

app.post("/api/auth", (req, res) => {
  const code = String(req.body?.code || "");
  const match = getEffectiveUsers().find(u => u.code === code);
  if (!match) return res.status(401).json({ error: "wrong code" });
  return res.status(200).json({ user: match.user, role: match.role, channel: `uwuprx-${code}` });
});

app.get("/api/auth-codes", (req, res) => {
  return res.status(200).json({ users: getEffectiveUsers() });
});

app.post("/api/auth-codes", (req, res) => {
  const actorCode = String(req.body?.actorCode || "");
  const user = String(req.body?.user || "");
  const code = String(req.body?.code || "").trim();
  if (!actorCode || !user || !/^\d{5}$/.test(code)) return res.status(400).json({ error: "invalid payload" });

  const users = getEffectiveUsers();
  const actor = users.find(u => u.code === actorCode);
  if (!actor || actor.role !== "owner" || actor.user !== "Ryder") {
    return res.status(403).json({ error: "owner access required" });
  }

  const target = users.find(u => u.user === user);
  if (!target) return res.status(404).json({ error: "user not found" });
  if (users.some(u => u.user !== user && u.code === code)) {
    return res.status(409).json({ error: "code already in use" });
  }

  const defaults = Object.fromEntries(DEFAULT_USERS.map(u => [u.user, u.code]));
  if (code === defaults[user]) delete globalThis.__uwuCodeOverrides[user];
  else globalThis.__uwuCodeOverrides[user] = code;

  return res.status(200).json({ ok: true, users: getEffectiveUsers() });
});

app.use(express.static(join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`uwu proxy v1.0.0 — http://localhost:${PORT}`);
});
