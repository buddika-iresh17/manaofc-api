const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// API Status Check
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const ytRouter = require('./yt');
router.use('/yt', ytRouter);

const xnxxRouter = require('./xnxx');
router.use('/xnxx', xnxxRouter);


module.exports = router;