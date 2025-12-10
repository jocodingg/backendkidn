const pool = require('../config/db');

async function insertEddyRaw(record) {
  const q = `INSERT INTO eddyraw
    (timestamp, source, co2, ch4, suhu, kelembapan, h2o, tekanan)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`;
  const values = [
    record.timestamp,
    record.source,
    record.co2,
    record.ch4,
    record.suhu,
    record.kelembapan,
    record.h2o,
    record.tekanan
  ];
  await pool.query(q, values);
}

module.exports = { insertEddyRaw };
