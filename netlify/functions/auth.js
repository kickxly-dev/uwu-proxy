// User codes — override via Netlify env vars for security
const USERS = {
  [process.env.CODE_RYDER    || "47291"]: { user: "Ryder",   role: "admin"  },
  [process.env.CODE_BECKHAM  || "83650"]: { user: "Beckham", role: "member" },
  [process.env.CODE_KOLLBY   || "29174"]: { user: "Kollby",  role: "member" },
  [process.env.CODE_LEVI     || "61837"]: { user: "Levi",    role: "member" },
  [process.env.CODE_LIAM     || "94523"]: { user: "Liam",    role: "member" },
  [process.env.CODE_LOGAN    || "35817"]: { user: "Logan",   role: "member" },
};

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, body: "Method Not Allowed" };

  let code;
  try { code = String(JSON.parse(event.body).code); } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "bad request" }) };
  }

  const match = USERS[code];
  if (!match) {
    return {
      statusCode: 401,
      headers: { ...CORS, "content-type": "application/json" },
      body: JSON.stringify({ error: "wrong code" }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...CORS, "content-type": "application/json" },
    body: JSON.stringify(match),
  };
};
