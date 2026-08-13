// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const { extractShiftFromPdf } = require("./scripts/pdfExtractor");
const { getUserByUsername, getNamesForUser } = require("./db");

const app = express();
const SETTINGS_PATH = path.join(__dirname, "settings.json");

// Seiten, die ohne Login erreichbar sein müssen (Login-Seite + ihre Assets).
const PUBLIC_PATHS = new Set([
  "/",
  "/views/dashboard.html",
  "/views/login.html",
]);

function isPublicRequest(req) {
  if (PUBLIC_PATHS.has(req.path)) return true;
  // Statische Assets (CSS, Bilder, Client-Scripts) müssen immer ladbar sein,
  // sonst kann die Login-Seite selbst nicht gerendert werden.
  if (
    req.path.startsWith("/views/styles/") ||
    req.path.startsWith("/img/") ||
    req.path.startsWith("/scripts/")
  ) {
    return true;
  }
  return false;
}

app.use(express.json({ limit: "25mb" })); // PDFs kommen als Base64 → können groß werden

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: __dirname }),
    secret: process.env.SESSION_SECRET || "bitte-in-produktion-aendern",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 12, // 12 Stunden
      // secure: true, // aktivieren, sobald der Server über HTTPS läuft
    },
  })
);

// Zugriffsschutz: alles außer Login-Seite + zugehörige statische Assets
// erfordert eine eingeloggte Session.
app.use((req, res, next) => {
  if (isPublicRequest(req) || req.path.startsWith("/api/login")) {
    return next();
  }
  if (req.session && req.session.userId) {
    return next();
  }
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ success: false, error: "Nicht eingeloggt" });
  }
  return res.redirect("/views/login.html");
});

app.use(express.static(__dirname)); // liefert views/, scripts/, img/, styles/ aus

app.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/views/index.html");
  }
  return res.redirect("/views/dashboard.html");
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Benutzername und Passwort erforderlich" });
  }

  const user = getUserByUsername(username);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, error: "Benutzername oder Passwort falsch" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res
      .status(401)
      .json({ success: false, error: "Benutzername oder Passwort falsch" });
  }

  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({ success: true, redirect: "/views/index.html" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true, redirect: "/views/login.html" });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false });
  }
  const names = getNamesForUser(req.session.userId);
  res.json({ success: true, username: req.session.username, names });
});

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
    res.json({ success: true, filePath, data: shiftJson });
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