const CHAT_CHANNEL = "uwuprx-chat";
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "*",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request }) {
  const user = request.headers.get("x-chat-user") || "anon";
  const body = await request.text();
  if (!body.trim()) {
    return new Response(JSON.stringify({ error: "empty message" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  try {
    const res = await fetch(`https://ntfy.sh/${CHAT_CHANNEL}`, {
      method: "POST",
      headers: { "Title": user, "Content-Type": "text/plain" },
      body,
    });
    return new Response(null, { status: res.ok ? 200 : 502, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}

export async function onRequestGet() {
  const upstream = await fetch(`https://ntfy.sh/${CHAT_CHANNEL}/sse`);
  const headers = new Headers(CORS);
  headers.set("content-type", "text/event-stream");
  headers.set("cache-control", "no-cache");
  headers.set("x-accel-buffering", "no");
  return new Response(upstream.body, { headers });
}
