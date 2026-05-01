module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers","*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,HEAD");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Server info
  if ((req.method === "GET" || req.method === "HEAD") && !req.headers["x-bare-url"]) {
    return res.status(200).json({
      versions: ["v3"],
      language: "JavaScript",
      memoryUsage: 0,
      maintainer: {},
      project: { name: "uwu-proxy", version: "1.0.0" },
    });
  }

  const targetUrl   = req.headers["x-bare-url"];
  const passHdrs    = JSON.parse(req.headers["x-bare-pass-headers"]    || "[]");
  const passStatus  = JSON.parse(req.headers["x-bare-pass-status"]     || "[]");
  const fwdHdrs     = JSON.parse(req.headers["x-bare-forward-headers"] || "[]");

  if (!targetUrl) return res.status(400).json({ code: "MISSING_BARE_URL", id: "err", message: "X-Bare-Url required" });

  let reqHeaders = {};
  try { reqHeaders = JSON.parse(req.headers["x-bare-headers"] || "{}"); } catch {}
  for (const h of fwdHdrs) { const v = req.headers[h.toLowerCase()]; if (v) reqHeaders[h] = v; }

  try {
    const fetchOpts = { method: req.method, headers: reqHeaders, redirect: "manual" };

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      fetchOpts.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(targetUrl, fetchOpts);
    const resHdrs  = {};
    upstream.headers.forEach((v, k) => { resHdrs[k] = v; });

    for (const h of passHdrs) { const v = upstream.headers.get(h); if (v != null) res.setHeader(h, v); }

    res.setHeader("x-bare-status",      String(upstream.status));
    res.setHeader("x-bare-status-text", upstream.statusText || "OK");
    res.setHeader("x-bare-headers",     JSON.stringify(resHdrs));
    res.setHeader("content-type",       "application/octet-stream");

    const statusCode = passStatus.includes(upstream.status) ? upstream.status : 200;
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(statusCode).send(buf);
  } catch (err) {
    return res.status(500).json({ code: "UNKNOWN", id: "err", message: err.message });
  }
};
