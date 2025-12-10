const express = require('express');
const router = express.Router();
const { downloadCsv } = require('../controllers/downloadController');

router.get('/download', downloadCsv);

module.exports = router;
