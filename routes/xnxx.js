const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Route for searching
router.get('/search', async (req, res) => {
  const searchQuery = req.query.query; // Use query param
  if (!searchQuery) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const searchUrl = `https://www.xnxx.com/search/${encodeURIComponent(searchQuery)}`;

  try {
    // Fetch the page content using axios
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    // Load the page content into cheerio to parse it
    const $ = cheerio.load(response.data);
    let results = [];

    // Example of parsing search results, adjust selectors as per the target website's structure
    $('.mozaique .thumb').each((i, el) => {
      const title = $(el).find('p.title a').text().trim();
      const url = 'https://www.xnxx.com' + $(el).find('p.title a').attr('href');
      const thumb = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
      const duration = $(el).find('.duration').text().trim();
      const videoSize = $(el).find('.hd').text().trim() || null;

      // Ensure no empty results
      if (title && url) {
        results.push({ title, url, thumb, duration, videoSize });
      }
    });

    // Return the scraped data with thumbnails
    res.json({ results });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error fetching data from XNXX' });
  }
});

// Route for downloading XNXX videos
router.get('/download', async (req, res) => {
  const videoUrl = req.query.url;
  
  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  // Construct the TubeNinja URL for fetching the download link
  const tubeNinjaUrl = `https://www.tubeninja.net/welcome?url=${encodeURIComponent(videoUrl)}`;

  try {
    // Make a request to the TubeNinja service to get the download link
    const response = await axios.get(tubeNinjaUrl);

    // Extract the download link (assuming TubeNinja provides it in the response)
    const downloadLink = extractDownloadLink(response.data);

    if (downloadLink) {
      res.json({ downloadUrl: downloadLink });
    } else {
      res.status(500).json({ error: 'Unable to fetch the download link' });
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error fetching data from TubeNinja' });
  }
});

// Helper function to extract the download link from TubeNinja's response
function extractDownloadLink(htmlData) {
  const downloadLinkPattern = /href="(https:\/\/[^"]+\.mp4)"/; // This may change based on TubeNinja's response format
  const match = htmlData.match(downloadLinkPattern);
  
  if (match && match[1]) {
    return match[1];  // Return the download link
  }

  return null;
}

module.exports = router;
