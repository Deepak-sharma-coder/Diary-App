const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

/* =====================================================
   CONFIG: edit these values
   ===================================================== */
const CONFIG = {
  port: 5000,
  db: {
    host: "localhost",
    user: "root",
    password: "Deepak@123",
    database: "login_app",
  },
  // Move these to a .env file before you ever deploy
  jwtSecret: process.env.JWT_SECRET || "change-this-secret-before-deploying",
  googleClientId:
    process.env.GOOGLE_CLIENT_ID || "your-client-id.apps.googleusercontent.com",
  frontendOrigins: ["http://localhost:5173", "http://localhost:3000"],
};

const MOODS = ["Reflective", "Grateful", "Calm", "Heavy", "Joyful"];
const VISIBILITIES = ["private", "protected", "public"];
const MAX_PIN_TRIES = 5; // wrong PINs allowed per entry...
const PIN_LOCK_MS = 15 * 60 * 1000; // ...before a 15 minute lock

const app = express();
app.use(cors({ origin: CONFIG.frontendOrigins }));
app.use(express.json({ limit: "25mb" })); // diary photos arrive as base64

const googleClient = new OAuth2Client(CONFIG.googleClientId);

/* =====================================================
   DATABASE: one connection, tables created on start
   ===================================================== */
let db;

async function connectDatabase() {
  const { database, ...connection } = CONFIG.db;

  db = await mysql.createConnection(connection);
  await db.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await db.query(`USE \`${database}\``);

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(20) NULL,
      password VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Google accounts have no phone or password, so allow NULL in an older table
  try {
    await db.query(
      "ALTER TABLE users MODIFY phone VARCHAR(20) NULL, MODIFY password VARCHAR(255) NULL"
    );
  } catch (err) {
    console.warn("Could not relax users columns:", err.message);
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS diary_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(150) NOT NULL,
      share_id VARCHAR(40) NOT NULL UNIQUE,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      mood VARCHAR(20) NOT NULL DEFAULT 'Reflective',
      tags TEXT,
      photos LONGTEXT,
      visibility ENUM('private','protected','public') NOT NULL DEFAULT 'private',
      pin_hash VARCHAR(100) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      INDEX idx_user_email (user_email)
    )
  `);

  console.log(`Database "${database}" is ready.`);
}

/* =====================================================
   HELPERS
   ===================================================== */
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const signToken = (email) =>
  jwt.sign({ email }, CONFIG.jwtSecret, { expiresIn: "7d" });

const authResponse = (message, user) => ({
  message,
  user: { name: user.name, email: user.email }, // never send the password
  token: signToken(user.email),
});

// Protects every diary route: the request must carry "Authorization: Bearer <token>"
const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in first." });

  try {
    req.userEmail = jwt.verify(token, CONFIG.jwtSecret).email;
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
};

const isPin = (value) => /^\d{4}$/.test(String(value ?? ""));

const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text) ?? fallback;
  } catch {
    return fallback;
  }
};

// Turns a database row into the object the React pages use.
// Protected entries hide their text and photos until the PIN is checked.
const formatEntry = (row, { revealLocked = false } = {}) => {
  const locked = row.visibility === "protected" && !revealLocked;
  const entry = {
    id: row.id,
    title: row.title,
    mood: row.mood,
    tags: parseJson(row.tags, []),
    visibility: row.visibility,
    date: new Date(row.created_at).toISOString(),
    locked,
    content: locked ? "" : row.content || "",
    photos: locked ? [] : parseJson(row.photos, []),
    shareId: row.visibility === "public" ? row.share_id : null,
  };
  if (row.updated_at) entry.updatedAt = new Date(row.updated_at).toISOString();
  return entry;
};

// Checks and cleans the fields sent when creating or editing an entry
const cleanEntryBody = (body = {}) => {
  const title = String(body.title || "").trim().slice(0, 200);
  const content = String(body.content || "").trim();
  if (!title && !content) {
    return { error: "Write a title or a few lines before saving." };
  }

  const visibility = body.visibility ?? "private";
  if (!VISIBILITIES.includes(visibility)) {
    return { error: "Privacy must be private, protected or public." };
  }

  return {
    value: {
      title: title || "Untitled",
      content,
      visibility,
      mood: MOODS.includes(body.mood) ? body.mood : "Reflective",
      tags: Array.isArray(body.tags)
        ? body.tags
            .map((t) => String(t).trim().replace(/^#/, ""))
            .filter(Boolean)
            .slice(0, 20)
        : [],
      photos: Array.isArray(body.photos)
        ? body.photos
            .filter((p) => typeof p === "string" && p.startsWith("data:image/"))
            .slice(0, 10)
        : [],
    },
  };
};

const findOwnEntry = async (id, email) => {
  const [rows] = await db.query(
    "SELECT * FROM diary_entries WHERE id = ? AND user_email = ?",
    [id, email]
  );
  return rows[0] || null;
};

// Wrong-PIN limiter: a 4-digit PIN could otherwise be guessed in minutes
const pinFailures = new Map();

const verifyEntryPin = async (row, pin, email) => {
  const key = `${email}:${row.id}`;
  const record = pinFailures.get(key) || { count: 0, until: 0 };

  if (record.until > Date.now()) {
    return { ok: false, status: 429, message: "Too many wrong PINs. Try again in a few minutes." };
  }

  const ok = isPin(pin) && (await bcrypt.compare(String(pin), row.pin_hash));
  if (ok) {
    pinFailures.delete(key);
    return { ok: true };
  }

  record.count += 1;
  if (record.count >= MAX_PIN_TRIES) {
    record.count = 0;
    record.until = Date.now() + PIN_LOCK_MS;
  }
  pinFailures.set(key, record);
  return { ok: false, status: 401, message: "That PIN is incorrect." };
};

/* =====================================================
   AUTH ROUTES
   ===================================================== */
app.get("/", (req, res) => res.json({ message: "Veritas Diary API is running." }));

// SIGNUP
app.post("/signup", wrap(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const [existing] = await db.query("SELECT email FROM users WHERE email = ?", [cleanEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
    [name.trim(), cleanEmail, phone?.trim() || null, hash]
  );

  res.status(201).json(authResponse("Account created", { name: name.trim(), email: cleanEmail }));
}));

// LOGIN
app.post("/login", wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const [rows] = await db.query(
    "SELECT name, email, password FROM users WHERE email = ?",
    [email.trim().toLowerCase()]
  );
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (!user.password) {
    return res.status(400).json({
      message: "This account uses Google sign-in. Use the Google button instead.",
    });
  }
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json(authResponse("Login successful", user));
}));

// GOOGLE LOGIN + SIGNUP (creates the account if the email is new)
app.post("/auth/google", wrap(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "Missing Google credential." });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: CONFIG.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }

  if (!payload.email_verified) {
    return res.status(401).json({ message: "Your Google email is not verified." });
  }

  const email = payload.email.toLowerCase();
  const [rows] = await db.query("SELECT name, email FROM users WHERE email = ?", [email]);

  if (rows.length > 0) {
    return res.json(authResponse("Login successful", rows[0]));
  }

  const name = payload.name || email.split("@")[0];
  await db.query(
    "INSERT INTO users (name, email, phone, password) VALUES (?, ?, NULL, NULL)",
    [name, email]
  );
  res.status(201).json(authResponse("Account created", { name, email }));
}));

// Who is logged in (used to restore a session)
app.get("/me", auth, wrap(async (req, res) => {
  const [rows] = await db.query("SELECT name, email FROM users WHERE email = ?", [req.userEmail]);
  if (!rows[0]) return res.status(404).json({ message: "Account not found." });
  res.json({ user: rows[0] });
}));

/* =====================================================
   DIARY ROUTES (all need a logged-in user)
   ===================================================== */

// LIST: protected entries come back locked (no text, no photos)
app.get("/entries", auth, wrap(async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM diary_entries WHERE user_email = ? ORDER BY created_at DESC, id DESC",
    [req.userEmail]
  );
  res.json({ entries: rows.map((row) => formatEntry(row)) });
}));

// ADD
app.post("/entries", auth, wrap(async (req, res) => {
  const { error, value } = cleanEntryBody(req.body);
  if (error) return res.status(400).json({ message: error });

  let pinHash = null;
  if (value.visibility === "protected") {
    if (!isPin(req.body.pin)) {
      return res.status(400).json({ message: "Enter a 4-digit PIN to protect this entry." });
    }
    pinHash = await bcrypt.hash(String(req.body.pin), 10);
  }

  const [result] = await db.query(
    `INSERT INTO diary_entries
       (user_email, share_id, title, content, mood, tags, photos, visibility, pin_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.userEmail,
      crypto.randomBytes(16).toString("hex"),
      value.title,
      value.content,
      value.mood,
      JSON.stringify(value.tags),
      JSON.stringify(value.photos),
      value.visibility,
      pinHash,
    ]
  );

  const row = await findOwnEntry(result.insertId, req.userEmail);
  res.status(201).json({ message: "Entry saved", entry: formatEntry(row, { revealLocked: true }) });
}));

// OPEN ONE ENTRY: protected entries need the PIN in the body: { "pin": "1234" }
app.post("/entries/:id/unlock", auth, wrap(async (req, res) => {
  const row = await findOwnEntry(req.params.id, req.userEmail);
  if (!row) return res.status(404).json({ message: "Entry not found." });

  if (row.visibility === "protected") {
    const check = await verifyEntryPin(row, req.body.pin, req.userEmail);
    if (!check.ok) return res.status(check.status).json({ message: check.message });
  }

  res.json({ entry: formatEntry(row, { revealLocked: true }) });
}));

// EDIT
//   - editing a protected entry needs its current PIN in "currentPin"
//   - "pin" sets a new PIN; leave it out to keep the existing one
app.put("/entries/:id", auth, wrap(async (req, res) => {
  const row = await findOwnEntry(req.params.id, req.userEmail);
  if (!row) return res.status(404).json({ message: "Entry not found." });

  if (row.visibility === "protected") {
    const check = await verifyEntryPin(row, req.body.currentPin, req.userEmail);
    if (!check.ok) return res.status(check.status).json({ message: check.message });
  }

  const { error, value } = cleanEntryBody(req.body);
  if (error) return res.status(400).json({ message: error });

  let pinHash = null;
  if (value.visibility === "protected") {
    if (req.body.pin !== undefined && req.body.pin !== "") {
      if (!isPin(req.body.pin)) {
        return res.status(400).json({ message: "The new PIN must be exactly 4 digits." });
      }
      pinHash = await bcrypt.hash(String(req.body.pin), 10);
    } else if (row.pin_hash) {
      pinHash = row.pin_hash; // keep the current PIN
    } else {
      return res.status(400).json({ message: "Enter a 4-digit PIN to protect this entry." });
    }
  }

  await db.query(
    `UPDATE diary_entries
        SET title = ?, content = ?, mood = ?, tags = ?, photos = ?,
            visibility = ?, pin_hash = ?, updated_at = NOW()
      WHERE id = ? AND user_email = ?`,
    [
      value.title,
      value.content,
      value.mood,
      JSON.stringify(value.tags),
      JSON.stringify(value.photos),
      value.visibility,
      pinHash,
      row.id,
      req.userEmail,
    ]
  );

  const updated = await findOwnEntry(row.id, req.userEmail);
  res.json({ message: "Entry updated", entry: formatEntry(updated, { revealLocked: true }) });
}));

// DELETE: a protected entry needs its PIN in the body: { "currentPin": "1234" }
app.delete("/entries/:id", auth, wrap(async (req, res) => {
  const row = await findOwnEntry(req.params.id, req.userEmail);
  if (!row) return res.status(404).json({ message: "Entry not found." });

  if (row.visibility === "protected") {
    const check = await verifyEntryPin(row, req.body?.currentPin, req.userEmail);
    if (!check.ok) return res.status(check.status).json({ message: check.message });
  }

  await db.query("DELETE FROM diary_entries WHERE id = ? AND user_email = ?", [
    row.id,
    req.userEmail,
  ]);
  res.json({ message: "Entry deleted" });
}));

// PUBLIC SHARE LINK: no login needed, only works for entries set to "public"
app.get("/public/:shareId", wrap(async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM diary_entries WHERE share_id = ? AND visibility = 'public'",
    [req.params.shareId]
  );
  if (!rows[0]) {
    return res.status(404).json({ message: "This entry is not available." });
  }

  const { title, content, mood, tags, photos, date } = formatEntry(rows[0]);
  res.json({ entry: { title, content, mood, tags, photos, date } });
}));

/* =====================================================
   ERRORS + START
   ===================================================== */
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

connectDatabase()
  .then(() => {
    app.listen(CONFIG.port, () =>
      console.log(`Server running on http://localhost:${CONFIG.port}`)
    );
  })
  .catch((err) => {
    console.error("Could not start the server:", err.message);
    process.exit(1);
  });