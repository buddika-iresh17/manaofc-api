const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.get('/search', async (req, res) => {
    const searchQuery = req.params.query;
    const searchUrl = `https://www.xnxx.com/search/${encodeURIComponent(searchQuery)}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
        });

        const $ = cheerio.load(response.data);
        let results = [];

        $('.mozaique .thumb').each((i, el) => {
            const title = $(el).find('p.title a').text().trim();
            const url = 'https://www.xnxx.com' + $(el).find('p.title a').attr('href');
            const thumb = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');

            const duration = $(el).find('.duration').text().trim();

            // Sometimes, resolution/size appears as a <span class="hd">HD</span> or other metadata
            const videoSize = $(el).find('.hd').text().trim() || null;

            results.push({ title, url, thumb, duration, videoSize });
        });

        res.json({ results });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

module.exports = router;
