const { Pool } = require('pg');
require('dotenv').config();

const PG_PASSWORD = process.env.PG_PASSWORD || process.env.PG_PASWORD || '';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER,
  password: PG_PASSWORD,
  database: process.env.PG_DATABASE,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
  // process.exit(-1) // jangan crash, tapi log
});

module.exports = pool;
