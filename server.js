import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 8080;

// SW at root needs scope "/" — serve with the required header
app.get("/sw.js", (req, res) => {
  res.setHeader("Service-Worker-Allowed", "/");
  res.sendFile(join(__dirname, "public/sw.js"));
});

app.use(express.static(join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`uwu proxy v1.0.0 — http://localhost:${PORT}`);
});
