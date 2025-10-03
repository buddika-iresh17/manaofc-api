const express = require('express');
const router = express.Router();
const axios = require('axios');
const ytdl = require('ytdl-core'); // Assuming you're using this for additional video data fetching like duration
const cheerio = require('cheerio'); // <-- MISSING IMPORT FIXED ✅

// Example: GET /search?query=car
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: "Query parameter is required" });

    // 1. Search YouTube using axios
    const API_KEY = 'AIzaSyBNSnx0mwJOGP4wCVmrgb3TY9nUXWD3n5Y';  
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}&maxResults=5`;  
    const response = await axios.get(url);  
    const items = response.data.items;  

    // 2. Map items to a clean result array
    const results = await Promise.all(items.map(async (item) => {
      // Fetch the duration using ytdl
      const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
      const info = await ytdl.getInfo(videoUrl); // Fetch video details using ytdl
      const duration = info.videoDetails.lengthSeconds;

      return {  
        thumbnails: item.snippet.thumbnails,  // Fixed thumbnails
        videoId: item.id.videoId,  
        title: item.snippet.title,  
        channel: item.snippet.channelTitle,  
        duration, // Fixed duration issue
        link: videoUrl
      };
    }));

    res.json({ query, results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
