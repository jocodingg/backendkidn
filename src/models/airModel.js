const pool = require('../config/db');

async function insertAirRaw(record) {
  const q = `INSERT INTO airraw
    (timestamp, source, pm25, voc)
    VALUES ($1,$2,$3,$4)`;
  const values = [
    record.timestamp, 
    record.source, 
    record.pm25, 
    record.voc
  ];
  await pool.query(q, values);
}

async function getLatestAirForSource(source) {
  const q = `SELECT * FROM airraw WHERE source = $1 ORDER BY timestamp DESC LIMIT 1`;
  const res = await pool.query(q, [source]);
  return res.rows[0];
}

module.exports = { insertAirRaw, getLatestAirForSource };
