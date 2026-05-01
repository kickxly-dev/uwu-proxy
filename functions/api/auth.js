const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const USERS = {
    [env.CODE_RYDER   || "82047"]: { user: "Ryder",   role: "owner"       },
    [env.CODE_LOGAN   || "63914"]: { user: "Logan",   role: "slave owner" },
    [env.CODE_BECKHAM || "39571"]: { user: "Beckham", role: "slave"       },
    [env.CODE_KOLBY   || "74286"]: { user: "Kolby",   role: "slave"       },
    [env.CODE_LEVI    || "51839"]: { user: "Levi",    role: "slave"       },
    [env.CODE_LIAM    || "26473"]: { user: "Liam",    role: "slave"       },
    [env.CODE_GIBSON  || "98132"]: { user: "Gibson",  role: "slave"       },
  };

  try {
    const { code } = await request.json();
    const match = USERS[String(code || "")];
    if (!match) return new Response(JSON.stringify({ error: "wrong code" }), { status: 401, headers: CORS });
    return new Response(JSON.stringify(match), { status: 200, headers: CORS });
  } catch {
    return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: CORS });
  }
}
