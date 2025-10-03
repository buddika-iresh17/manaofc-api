const express = require('express');
const router = express.Router();
const axios = require('axios');
const ytdl = require('ytdl-core'); 
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


// --------------------
// 🔥 Convert YouTube → mp3/mp4 using yt.savetube.me
// --------------------
async function ytmp3(link, format = "mp3") {
  try {
    // 1. Access yt.savetube.me
    const pageRes = await axios.get("https://yt.savetube.me", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
      },
    });

    const $ = cheerio.load(pageRes.data); // parse hidden tokens if needed

    // 2. Create conversion task
    const createUrl = `https://loader.to/ajax/download.php?button=1&format=${format}&url=${encodeURIComponent(link)}`;
    const createRes = await axios.get(createUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
        Referer: "https://yt.savetube.me/",
      },
    });

    if (!createRes.data.success || !createRes.data.id) {
      throw new Error("Failed to create task. Invalid link or format.");
    }

    const taskId = createRes.data.id;

    // 3. Poll until download is ready
    let downloadUrl = null;
    let title = "";
    let thumbnail = "";

    while (!downloadUrl) {
      await new Promise(r => setTimeout(r, 3000)); // wait 3s

      const statusUrl = `https://loader.to/ajax/progress.php?id=${taskId}`;
      const statusRes = await axios.get(statusUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36",
          Referer: "https://yt.savetube.me/",
        },
      });

      if (statusRes.data.download_url) {
        downloadUrl = statusRes.data.download_url;
        title = statusRes.data.title || "";
        thumbnail = statusRes.data.thumbnail || "";
      } else if (statusRes.data.error) {
        throw new Error("Conversion failed: " + statusRes.data.error);
      }
    }

    return {
      title,
      Created_by: 'manisha sasmitha',
      thumbnail,
      format,
      downloadUrl,
    };

  } catch (err) {
    console.error("ytmp3 error:", err.message);
    return null;
  }
}

// Example route: GET /download?url=YOUTUBE_LINK
router.get('/download', async (req, res) => {
  try {
    const url = req.query.url;
    const format = req.query.format || "mp3";

    if (!url) return res.status(400).json({ error: "url parameter is required" });

    const data = await ytmp3(url, format);
    if (!data) return res.status(500).json({ error: "Conversion failed" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;