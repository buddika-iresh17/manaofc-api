const express = require('express');
const router = express.Router();
const axios = require('axios');

// =======================
// Search YouTube (with loader.to direct download links and thumbnails)
// =======================
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: "Query parameter is required" });

    // YouTube Search via API  
    const API_KEY = 'AIzaSyBNSnx0mwJOGP4wCVmrgb3TY9nUXWD3n5Y';
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}&maxResults=5`;

    const response = await axios.get(url);

    const items = response.data.items;

    // Map search results + call loader.to for each
    const results = await Promise.all(items.map(async (item) => {
      const videoId = item.id.videoId;
      const videoURL = `https://www.youtube.com/watch?v=${videoId}`;

      // Extract the thumbnail URL
      const thumbnailUrl = item.snippet.thumbnails.high.url;  // Using "high" resolution thumbnail

      try {
        // Fetch download links from loader.to
        const loaderResMP3 = await axios.get(`https://loader.to/ajax/download.php?button=1&format=mp3&url=${encodeURIComponent(videoURL)}`);
        const loaderResMP4 = await axios.get(`https://loader.to/ajax/download.php?button=1&format=mp4&url=${encodeURIComponent(videoURL)}`);

        return {
          videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          link: videoURL,
          thumbnail: thumbnailUrl,  // Add the thumbnail URL
          downloads: {
            mp3: loaderResMP3.data,  // mp3 download link
            mp4: loaderResMP4.data   // mp4 download link
          }
        };
      } catch (err) {
        return {
          videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          link: videoURL,
          thumbnail: thumbnailUrl,  // Add the thumbnail URL
          downloads: null
        };
      }
    }));

    res.json({ query, results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// =======================
// Direct loader.to Download (if only videoId given)
// =======================
router.get('/loader', async (req, res) => {
  try {
    const videoId = req.query.videoId;
    const format = req.query.format || 'mp4';  // Default format is MP4 if not provided
    if (!videoId) return res.status(400).json({ error: "videoId parameter is required" });

    const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
    const apiURL = `https://loader.to/ajax/download.php?button=1&format=${format}&url=${encodeURIComponent(videoURL)}`;

    // Fetch download links from loader.to
    const response = await axios.get(apiURL);

    res.json(response.data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "loader.to API failed" });
  }
});

module.exports = router;
