require('dotenv').config();
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');

const mqttService = require('./src/services/mqttService');
const downloadRoutes = require('./src/routes/downloadRoutes');
const realtimeCache = require('./src/utils/realtimeCache');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;

const app = express();

// CORS domain frontend
app.use(cors({
  origin: [
    "https://skyflux.c-greenproject.org",
    "https://www.skyflux.c-greenproject.org",
    "http://localhost:5173"
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(bodyParser.json());

// Basic endpoints
app.get("/", (req, res) => {
  res.send("🚀 SkyFlux Backend is Running (HTTP realtime)!");
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes (download)
app.use('/api', downloadRoutes);

// ------------------
// Polling endpoint
// GET /api/latest?source=DRONE1
// ------------------
app.get('/api/latest', (req, res) => {
  try {
    const source = req.query.source;
    if (source) {
      const rec = realtimeCache.getLatest(source);
      if (!rec) return res.status(404).json({ error: 'No data for source' });
      return res.json(rec);
    }
    // jika tidak ada source, kembalikan semua latest
    const all = realtimeCache.getAllLatest();
    return res.json(all);
  } catch (err) {
    console.error('GET /api/latest error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ------------------
// SSE endpoint
// GET /api/stream
// Clients connect and receive update every 1s
// ------------------
const sseClients = new Set();

app.get('/api/stream', (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Wajib untuk CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://skyflux.c-greenproject.org');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Flush header (kalau ada)
  res.flushHeaders && res.flushHeaders();

  const clientId = Date.now() + Math.random();
  const client = { id: clientId, res };
  sseClients.add(client);

  // Kirim event welcome
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'connected' })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// Broadcast loop: setiap 1s kirim snapshot ke semua client SSE
setInterval(() => {
  if (sseClients.size === 0) return;
  const payload = realtimeCache.getAllLatest();
  const str = JSON.stringify(payload);
  for (const c of sseClients) {
    try {
      c.res.write(`event: alldata\ndata: ${str}\n\n`);
    } catch (err) {
      // client mungkin sudah disconnect
      sseClients.delete(c);
    }
  }
}, 1000);

// Create HTTP server
const server = http.createServer(app);

// START SERVER
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT} (SSE / Polling enabled)`);
  mqttService.start();
});
