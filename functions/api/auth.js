const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

const DEFAULT_USERS = [
  { user: "Ryder",   role: "owner",       code: "82047", envKey: "CODE_RYDER" },
  { user: "Logan",   role: "slave owner", code: "63914", envKey: "CODE_LOGAN" },
  { user: "Beckham", role: "slave",       code: "39571", envKey: "CODE_BECKHAM" },
  { user: "Kolby",   role: "slave",       code: "74286", envKey: "CODE_KOLBY" },
  { user: "Levi",    role: "slave",       code: "51839", envKey: "CODE_LEVI" },
  { user: "Liam",    role: "slave",       code: "26473", envKey: "CODE_LIAM" },
  { user: "Gibson",  role: "slave",       code: "98132", envKey: "CODE_GIBSON" },
];

globalThis.__uwuCodeOverrides = globalThis.__uwuCodeOverrides || {};

function getEffectiveUsers(env) {
  const overrides = globalThis.__uwuCodeOverrides || {};
  return DEFAULT_USERS.map(u => ({
    user: u.user,
    role: u.role,
    code: String(overrides[u.user] || env?.[u.envKey] || u.code),
  }));
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const { code } = await request.json();
    const value = String(code || "");
    const match = getEffectiveUsers(env).find(u => u.code === value);
    if (!match) return new Response(JSON.stringify({ error: "wrong code" }), { status: 401, headers: CORS });
    return new Response(JSON.stringify({ user: match.user, role: match.role, channel: `uwuprx-${value}` }), { status: 200, headers: CORS });
  } catch {
    return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: CORS });
  }
}
