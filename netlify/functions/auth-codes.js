const fs = require("fs/promises");
const OVERRIDES_FILE = "/tmp/uwu-auth-codes.json";

const DEFAULT_USERS = [
  { user: "Ryder",   role: "owner",       code: process.env.CODE_RYDER   || "82047" },
  { user: "Logan",   role: "slave owner", code: process.env.CODE_LOGAN   || "63914" },
  { user: "Beckham", role: "slave",       code: process.env.CODE_BECKHAM || "39571" },
  { user: "Kolby",   role: "slave",       code: process.env.CODE_KOLBY   || "74286" },
  { user: "Levi",    role: "slave",       code: process.env.CODE_LEVI    || "51839" },
  { user: "Liam",    role: "slave",       code: process.env.CODE_LIAM    || "26473" },
  { user: "Gibson",  role: "slave",       code: process.env.CODE_GIBSON  || "98132" },
];

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

async function readOverrides() {
  try {
    const raw = await fs.readFile(OVERRIDES_FILE, "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

async function writeOverrides(data) {
  await fs.writeFile(OVERRIDES_FILE, JSON.stringify(data), "utf8");
}

async function getEffectiveUsers() {
  const overrides = await readOverrides();
  return DEFAULT_USERS.map(u => ({ ...u, code: String(overrides[u.user] || u.code) }));
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { ...CORS, "content-type": "application/json" },
      body: JSON.stringify({ users: await getEffectiveUsers() }),
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "method not allowed" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}

  const actorCode = String(body.actorCode || "");
  const user = String(body.user || "");
  const code = String(body.code || "").trim();
  if (!actorCode || !user || !/^\d{5}$/.test(code)) {
    return { statusCode: 400, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "invalid payload" }) };
  }

  const users = await getEffectiveUsers();
  const actor = users.find(u => u.code === actorCode);
  if (!actor || actor.role !== "owner" || actor.user !== "Ryder") {
    return { statusCode: 403, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "owner access required" }) };
  }

  const target = users.find(u => u.user === user);
  if (!target) {
    return { statusCode: 404, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "user not found" }) };
  }

  if (users.some(u => u.user !== user && u.code === code)) {
    return { statusCode: 409, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "code already in use" }) };
  }

  const defaults = Object.fromEntries(DEFAULT_USERS.map(u => [u.user, u.code]));
  const overrides = await readOverrides();
  if (code === defaults[user]) delete overrides[user];
  else overrides[user] = code;
  await writeOverrides(overrides);

  return {
    statusCode: 200,
    headers: { ...CORS, "content-type": "application/json" },
    body: JSON.stringify({ ok: true, users: await getEffectiveUsers() }),
  };
};
