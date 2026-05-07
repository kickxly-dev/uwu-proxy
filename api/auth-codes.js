const fs = require("fs/promises");
const OVERRIDES_FILE = "/tmp/uwu-auth-codes.json";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

const DEFAULT_USERS = [
  { user: "Ryder",   role: "owner",       code: process.env.CODE_RYDER   || "82047" },
  { user: "Logan",   role: "slave owner", code: process.env.CODE_LOGAN   || "63914" },
  { user: "Beckham", role: "slave",       code: process.env.CODE_BECKHAM || "39571" },
  { user: "Kolby",   role: "slave",       code: process.env.CODE_KOLBY   || "74286" },
  { user: "Levi",    role: "slave",       code: process.env.CODE_LEVI    || "51839" },
  { user: "Liam",    role: "slave",       code: process.env.CODE_LIAM    || "26473" },
  { user: "Gibson",  role: "slave",       code: process.env.CODE_GIBSON  || "98132" },
];

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

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({ users: await getEffectiveUsers() });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const actorCode = String(req.body?.actorCode || "");
  const user = String(req.body?.user || "");
  const code = String(req.body?.code || "").trim();
  if (!actorCode || !user || !/^\d{5}$/.test(code)) {
    return res.status(400).json({ error: "invalid payload" });
  }

  const users = await getEffectiveUsers();
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
  const overrides = await readOverrides();
  if (code === defaults[user]) delete overrides[user];
  else overrides[user] = code;
  await writeOverrides(overrides);

  return res.status(200).json({ ok: true, users: await getEffectiveUsers() });
};
