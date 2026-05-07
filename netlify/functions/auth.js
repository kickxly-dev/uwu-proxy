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

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")   return { statusCode: 405, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "method not allowed" }) };

  let code = "";
  try { code = String(JSON.parse(event.body || "{}").code || ""); } catch {}

  const match = (await getEffectiveUsers()).find(u => u.code === code);
  if (!match) return { statusCode: 401, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "wrong code" }) };
  return { statusCode: 200, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ user: match.user, role: match.role, channel: `uwuprx-${code}` }) };
};
