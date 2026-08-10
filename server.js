// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const { extractShiftFromPdf } = require("./scripts/pdfExtractor");

const app = express();
const SETTINGS_PATH = path.join(__dirname, "settings.json");

app.use(express.json({ limit: "25mb" })); // PDFs kommen als Base64 → können groß werden
app.use(express.static(__dirname));       // liefert views/, scripts/, img/, styles/ aus

app.get("/", (req, res) => res.redirect("/views/index_start.html"));

app.post("/api/extract-and-save", async (req, res) => {
  try {
    const { base64 } = req.body;
    const buffer = Buffer.from(base64, "base64");
    const shiftJson = await extractShiftFromPdf(buffer);

    const outputDir = path.join(__dirname, "structuredSeating");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const baseName = `Einteilung_${dd}${MM}${yyyy}`;

    let fileName = `${baseName}.json`;
    let counter = 1;
    while (fs.existsSync(path.join(outputDir, fileName))) {
      fileName = `${baseName} (${counter}).json`;
      counter++;
    }

    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(shiftJson, null, 2), "utf-8");
    res.json({ success: true, filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/settings", (req, res) => {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(req.body, null, 2), "utf-8");
  res.json({ success: true });
});

app.get("/api/settings", (req, res) => {
  if (!fs.existsSync(SETTINGS_PATH)) return res.json({});
  res.json(JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () => console.log(`Server läuft auf Port ${PORT}`));