const { insertAllData } = require('../models/alldataModel');
const realtimeCache = require('./realtimeCache');

const latestAirCache = {};   // air terbaru per source
const buffers = {};          // buffer eddy per source

// ==========================
// FLUSH SATU DETIK (1 ROW)
// ==========================
async function flushOne(src, buf) {
  if (!buf || !buf.rows.length) return;

  const fields = ['co2', 'ch4', 'suhu', 'kelembapan', 'h2o', 'tekanan'];
  const avg = {};

  for (const f of fields) {
    let sum = 0, count = 0;
    for (const r of buf.rows) {
      const v = Number(r[f]);
      if (!isNaN(v)) {
        sum += v;
        count++;
      }
    }
    avg[f] = count ? sum / count : null;
  }

  const air = latestAirCache[src] || { pm25: null, voc: null };

  const record = {
    timestamp: new Date(buf.sec * 1000),
    source: src,
    ...avg,
    pm25: air.pm25,
    voc: air.voc
  };

  await insertAllData(record);
  realtimeCache.setLatest(record);
}

// ==========================
// PUSH EDDY (7 Hz OK)
// ==========================
function pushEddy(row) {
  const src = row.source;
  const sec = Math.floor(new Date(row.timestamp).getTime() / 1000);

  if (!buffers[src]) {
    buffers[src] = { sec, rows: [row] };
    return;
  }

  // ganti detik → flush buffer lama
  if (buffers[src].sec !== sec) {
    flushOne(src, buffers[src]).catch(console.error);
    buffers[src] = { sec, rows: [row] };
  } else {
    buffers[src].rows.push(row);
  }
}

// ==========================
// PUSH AIR (1 Hz)
// ==========================
function pushAir(row) {
  latestAirCache[row.source] = {
    pm25: row.pm25,
    voc: row.voc,
    timestamp: row.timestamp
  };
}

// ==========================
// SAFETY FLUSH (ANTI NYANGKUT)
// ==========================
setInterval(() => {
  const nowSec = Math.floor(Date.now() / 1000);

  for (const src in buffers) {
    if (nowSec - buffers[src].sec >= 2) {
      flushOne(src, buffers[src]).catch(console.error);
      delete buffers[src];
    }
  }
}, 1000);

module.exports = { pushEddy, pushAir };
