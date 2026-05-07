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

async function readOverrides() {
  try {
    const raw = await fs.readFile(OVERRIDES_FILE, "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

async function getEffectiveUsers() {
  const overrides = await readOverrides();
  return DEFAULT_USERS.map(u => ({ ...u, code: String(overrides[u.user] || u.code) }));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "method not allowed" });

  const code = String(req.body?.code || "");
  if (!code) return res.status(400).json({ error: "missing code" });

  const match = (await getEffectiveUsers()).find(u => u.code === code);
  if (!match) return res.status(401).json({ error: "wrong code" });

  return res.status(200).json({ user: match.user, role: match.role, channel: `uwuprx-${code}` });
};
