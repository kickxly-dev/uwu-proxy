const USERS = {
  [process.env.CODE_RYDER   || "47291"]: { user: "Ryder",   role: "admin"  },
  [process.env.CODE_BECKHAM || "83650"]: { user: "Beckham", role: "member" },
  [process.env.CODE_KOLLBY  || "29174"]: { user: "Kollby",  role: "member" },
  [process.env.CODE_LEVI    || "61837"]: { user: "Levi",    role: "member" },
  [process.env.CODE_LIAM    || "94523"]: { user: "Liam",    role: "member" },
  [process.env.CODE_LOGAN   || "35817"]: { user: "Logan",   role: "member" },
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "method not allowed" });

  const code = String(req.body?.code || "");
  if (!code) return res.status(400).json({ error: "missing code" });

  const match = USERS[code];
  if (!match) return res.status(401).json({ error: "wrong code" });

  return res.status(200).json(match);
};
