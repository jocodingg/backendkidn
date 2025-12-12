require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');

const mqttService = require('./src/services/mqttService');
const downloadRoutes = require('./src/routes/downloadRoutes');
const wsBroadcast = require('./src/ws/wsBroadcast');

const PORT = process.env.PORT || 5000;
const WS_PATH = "/ws";

const app = express();

// CORS domain frontend
app.use(cors({
  origin: [
    "https://skyflux.c-greenproject.org",
    "https://www.skyflux.c-greenproject.org"
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(bodyParser.json());

// Basic endpoints
app.get("/", (req, res) => {
  res.send("🚀 SkyFlux Backend is Running!");
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api', downloadRoutes);

// Create HTTP server
const server = http.createServer(app);

// ===============================
//  WEBSOCKET FIX FOR RAILWAY
// ===============================

// Attach WebSocket directly to HTTP server
const wss = new WebSocket.Server({
  server,
  path: WS_PATH
});

// Init broadcast handler
wsBroadcast.init(wss);

wss.on("connection", (ws) => {
  console.log("WS client connected");

  ws.send(JSON.stringify({ type: "welcome", msg: "connected" }));

  ws.on("message", (msg) => {
    console.log("WS recv:", msg);
  });

  ws.on("close", () => console.log("WS client disconnected"));
});

// Keep-alive — Railway will kill WS if idle
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }
  });
}, 30000);

// ===============================
//  START SERVER
// ===============================
server.listen(PORT, () => {
  console.log(`HTTP/WS server running on port ${PORT}, WS_PATH: ${WS_PATH}`);
  mqttService.start();
});
