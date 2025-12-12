// src/utils/realtimeCache.js
// Menyimpan latest alldata per source (in-memory)
const latest = {}; // { source: record }

function setLatest(record) {
  if (!record || !record.source) return;
  latest[record.source] = record;
}

function getLatest(source) {
  if (!source) return null;
  return latest[source] || null;
}

function getAllLatest() {
  // mengembalikan array record
  return Object.keys(latest).map(k => latest[k]);
}

module.exports = { setLatest, getLatest, getAllLatest };
