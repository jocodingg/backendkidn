const pool = require('../config/db');

async function insertAllData(record) {
  const q = `INSERT INTO alldata
    (timestamp, source, co2, ch4, suhu, kelembapan, h2o, tekanan, pm25, voc)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
  const values = [
    record.timestamp,
    record.source,
    record.co2,
    record.ch4,
    record.suhu,
    record.kelembapan,
    record.h2o,
    record.tekanan,
    record.pm25,
    record.voc
  ];
  await pool.query(q, values);
}

async function fetchAllDataCSV({ source, from, to }) {
  let q = `SELECT timestamp, source, co2, ch4, suhu, kelembapan, h2o, tekanan, pm25, voc
           FROM alldata WHERE 1=1`;
  const vals = [];
  let idx = 1;

  if (source) {
    q += ` AND source = $${idx++}`;
    vals.push(source);
  }

  if (from) {
    q += ` AND timestamp >= to_timestamp($${idx++} / 1000.0)`;
    vals.push(Number(from));
  }

  if (to) {
    q += ` AND timestamp <= to_timestamp($${idx++} / 1000.0)`;
    vals.push(Number(to));
  }

  q += ` ORDER BY timestamp ASC`;

  const res = await pool.query(q, vals);
  return res.rows;
}

module.exports = { insertAllData, fetchAllDataCSV };
