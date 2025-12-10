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
const WS_PATH = "/ws";   // FIX — kunci path websocket

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

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });
wsBroadcast.init(wss);

// WebSocket upgrade handler (WAJIB untuk nginx)
server.on('upgrade', (req, socket, head) => {
  if (req.url === WS_PATH) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('WS client connected');
  ws.send(JSON.stringify({ type: 'welcome', msg: 'connected' }));
  ws.on('close', () => console.log('WS client disconnected'));
  ws.on('message', (msg) => {
    console.log('WS recv:', msg);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`HTTP/WS server running on port ${PORT}, ws path ${WS_PATH}`);
  mqttService.start();
});
