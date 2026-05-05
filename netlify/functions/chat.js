const CHAT_CHANNEL = "uwuprx-chat";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "method not allowed" }) };

  const user = event.headers["x-chat-user"] || "anon";
  const body = event.body || "";
  if (!body.trim()) return { statusCode: 400, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: "empty message" }) };

  try {
    const res = await fetch(`https://ntfy.sh/${CHAT_CHANNEL}`, {
      method: "POST",
      headers: { "Title": user, "Content-Type": "text/plain" },
      body,
    });
    return { statusCode: res.ok ? 200 : 502, headers: CORS, body: "" };
  } catch (e) {
    return { statusCode: 500, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify({ error: e.message }) };
  }
};
