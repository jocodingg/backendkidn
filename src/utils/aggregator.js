const { insertAllData } = require('../models/alldataModel');
const { getLatestAirForSource } = require('../models/airModel');
const wsBroadcast = require('../ws/wsBroadcast');

const buffers = {}; 
const latestAirCache = {}; // cache air terbaru per source

function pushEddy(row) {
  const src = row.source;
  const t = new Date(row.timestamp);
  const sec = Math.floor(t.getTime() / 1000);

  if (!buffers[src]) {
    buffers[src] = { sec, rows: [row] };
    return;
  }

  if (buffers[src].sec === sec) {
    buffers[src].rows.push(row);
  } else {
    // hanya ganti buffer, flush diserahkan ke timer
    buffers[src] = { sec, rows: [row] };
  }
}

// NEW: agar air masuk ke cache untuk digabung saat flush
function pushAir(row) {
  latestAirCache[row.source] = {
    pm25: row.pm25,
    voc: row.voc,
    timestamp: row.timestamp
  };
}

async function flushBuffer() {
  const nowSec = Math.floor(Date.now() / 1000);

  for (const src of Object.keys(buffers)) {
    const buf = buffers[src];
    if (!buf) continue;

    // flush hanya jika detik sudah lewat
    if (nowSec - buf.sec >= 1) {

      const rows = buf.rows;
      const fields = ['co2','ch4','suhu','kelembapan','h2o','tekanan'];
      const avg = {};

      fields.forEach(f => {
        let sum = 0, count = 0;
        rows.forEach(r => {
          const v = parseFloat(r[f]);
          if (!isNaN(v)) { sum += v; count++; }
        });
        avg[f] = count > 0 ? sum / count : null;
      });

      // ambil air terbaru
      const air = latestAirCache[src] || { pm25: null, voc: null };

      const record = {
        timestamp: new Date(buf.sec * 1000).toISOString(),
        source: src,
        co2: avg.co2,
        ch4: avg.ch4,
        suhu: avg.suhu,
        kelembapan: avg.kelembapan,
        h2o: avg.h2o,
        tekanan: avg.tekanan,
        pm25: air.pm25,
        voc: air.voc
      };

      await insertAllData(record)
        .catch(err => console.error("insertAllData error:", err));

      wsBroadcast.broadcast(JSON.stringify({ type: "alldata", data: record }));

      delete buffers[src];
    }
  }
}

// Flush 1 detik sekali
setInterval(flushBuffer, 1000);

module.exports = { pushEddy, pushAir };
