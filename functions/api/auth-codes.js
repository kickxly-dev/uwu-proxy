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

export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ users: getEffectiveUsers(env) }), { status: 200, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const actorCode = String(body?.actorCode || "");
    const user = String(body?.user || "");
    const code = String(body?.code || "").trim();

    if (!actorCode || !user || !/^\d{5}$/.test(code)) {
      return new Response(JSON.stringify({ error: "invalid payload" }), { status: 400, headers: CORS });
    }

    const users = getEffectiveUsers(env);
    const actor = users.find(u => u.code === actorCode);
    if (!actor || actor.role !== "owner" || actor.user !== "Ryder") {
      return new Response(JSON.stringify({ error: "owner access required" }), { status: 403, headers: CORS });
    }

    const target = users.find(u => u.user === user);
    if (!target) {
      return new Response(JSON.stringify({ error: "user not found" }), { status: 404, headers: CORS });
    }

    if (users.some(u => u.user !== user && u.code === code)) {
      return new Response(JSON.stringify({ error: "code already in use" }), { status: 409, headers: CORS });
    }

    const defaults = Object.fromEntries(DEFAULT_USERS.map(u => [u.user, env?.[u.envKey] || u.code]));
    if (code === defaults[user]) {
      delete globalThis.__uwuCodeOverrides[user];
    } else {
      globalThis.__uwuCodeOverrides[user] = code;
    }

    return new Response(JSON.stringify({ ok: true, users: getEffectiveUsers(env) }), { status: 200, headers: CORS });
  } catch {
    return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: CORS });
  }
}
