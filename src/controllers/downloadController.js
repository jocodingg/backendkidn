const { fetchAllDataCSV } = require('../models/alldataModel');
const { stringify } = require('csv-stringify');

async function downloadCsv(req, res) {
  try {
    const { source, from, to } = req.query;
    const rows = await fetchAllDataCSV({ source, from, to });
    // convert to CSV
    const header = ['timestamp','source','co2','ch4','suhu','kelembapan','h2o','tekanan','pm25','voc'];

    // Buat nama file
    // from & to adalah epoch ms → convert ke Date
    const fromDate = new Date(Number(from));
    const toDate = new Date(Number(to));

    // Format: YYYY-MM-DD_HH-mm
    const format = (d) => {
      const pad = (n) => String(n).padStart(2, "0");

      const YYYY = d.getUTCFullYear();
      const MM = pad(d.getUTCMonth() + 1);
      const DD = pad(d.getUTCDate());
      const HH = pad(d.getUTCHours());
      const mm = pad(d.getUTCMinutes());

      return `${YYYY}-${MM}-${DD}_${HH}-${mm}`;
    };

    const src = source ? source : "ALL";

    const filename = `${src}_${format(fromDate)}_to_${format(toDate)}.csv`;

    stringify([header, ...rows.map(r => [
      new Date(r.timestamp).toISOString(),
      r.source,
      r.co2,
      r.ch4,
      r.suhu,
      r.kelembapan,
      r.h2o,
      r.tekanan,
      r.pm25,
      r.voc
    ])], (err, output) => {
      if (err) 
        return res.status(500).json({ error: 'CSV generation failed' });
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Type", "text/csv");
      res.send(output);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { downloadCsv };
