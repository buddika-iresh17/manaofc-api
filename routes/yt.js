const express = require('express');
const router = express.Router();
const axios = require('axios');
const ytdl = require('ytdl-core'); // for downloading YouTube videos

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

const results = items.map(item => ({  
  videoId: item.id.videoId,  
  title: item.snippet.title,  
  channel: item.snippet.channelTitle,  
  link: `https://www.youtube.com/watch?v=${item.id.videoId}`  
}));  

res.json({ query, results });

} catch (err) {
console.error(err);
res.status(500).json({ error: "Something went wrong" });
}
});

// Example: GET /download?videoId=xxxx
router.get('/download', async (req, res) => {
try {
const videoId = req.query.videoId;
if (!videoId) return res.status(400).json({ error: "videoId parameter is required" });

const videoURL = `https://www.youtube.com/watch?v=${videoId}`;  

// Get video info  
const info = await ytdl.getInfo(videoURL);  
const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });  

// Send video download link and info  
res.json({  
  title: info.videoDetails.title,  
  channel: info.videoDetails.author.name,  
  lengthSeconds: info.videoDetails.lengthSeconds,  
  downloadURL: format.url  
});

} catch (err) {
console.error(err);
res.status(500).json({ error: "Failed to fetch video info or download link" });
}
});

module.exports = router;

