const PRESENCE_CHANNEL = "uwuprx-presence";
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "*",
};

function makeUsers(env) {
  return {
    [env.CODE_RYDER   || "82047"]: { user: "Ryder",   role: "owner"       },
    [env.CODE_LOGAN   || "63914"]: { user: "Logan",   role: "slave owner" },
    [env.CODE_BECKHAM || "39571"]: { user: "Beckham", role: "slave"       },
    [env.CODE_KOLBY   || "74286"]: { user: "Kolby",   role: "slave"       },
    [env.CODE_LEVI    || "51839"]: { user: "Levi",    role: "slave"       },
    [env.CODE_LIAM    || "26473"]: { user: "Liam",    role: "slave"       },
    [env.CODE_GIBSON  || "98132"]: { user: "Gibson",  role: "slave"       },
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const { code } = await request.json();
    const USERS = makeUsers(env);
    const match = USERS[String(code || "")];
    if (!match) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    await fetch(`https://ntfy.sh/${PRESENCE_CHANNEL}`, {
      method: "POST",
      headers: { "Title": match.user, "Content-Type": "text/plain" },
      body: "online",
    });
    return new Response(null, { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}

export async function onRequestGet() {
  const upstream = await fetch(`https://ntfy.sh/${PRESENCE_CHANNEL}/sse`);
  const headers = new Headers(CORS);
  headers.set("content-type", "text/event-stream");
  headers.set("cache-control", "no-cache");
  headers.set("x-accel-buffering", "no");
  return new Response(upstream.body, { headers });
}
