const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  console.log("INCOMING REQUEST:", req.method, req.url);
  next();
});

app.use(cors());
app.use(express.json());

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Global SSE Map for Progress Streaming
const sseClients = new Map();

app.get('/api/progress/:clientId', (req, res) => {
  const { clientId } = req.params;
  
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Add this res to our global connections map
  sseClients.set(clientId, res);

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

app.post('/api/info', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Use `--dump-json`, `--no-playlist`, and `--no-warnings` for blazing speed
  // NOTE: Disabling file size calculations in map below.
  const ytInfoArgs = ['--dump-json', '--no-playlist', '--no-warnings', '--force-ipv4', '--js-runtimes', 'node', '--extractor-args', 'youtube:player_client=android'];
  const isLongFormYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/');
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  if (isLongFormYouTube && fs.existsSync(cookiesPath)) {
    ytInfoArgs.push('--cookies', cookiesPath);
  }
  ytInfoArgs.push(url);

  const ytProcess = spawn('yt-dlp', ytInfoArgs);
  let output = '';
  let errorOutput = '';

  ytProcess.stdout.on('data', (data) => output += data.toString());
  ytProcess.stderr.on('data', (data) => errorOutput += data.toString());

  ytProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`yt-dlp info failed: ${errorOutput}`);
      return res.status(500).json({ error: 'Failed to fetch video information.' });
    }

    try {
      const info = JSON.parse(output);
      
      const availableFormats = (info.formats || [])
        .filter(f => {
           if (!f.format_note) return false;
           if (f.vcodec === 'none' && f.acodec === 'none') return false;
           
           // Super aggressive filter: if the string 'webm' or 'weba' appears literally ANYWHERE in the format manifest block, kill it.
           const stringified = JSON.stringify(f).toLowerCase();
           if (stringified.includes('webm') || stringified.includes('weba')) return false;
           
           return true;
        })
        .map(f => {
           let resolutionLabel = 'Audio Only';
           if (f.vcodec !== 'none') {
              const res = f.height;
              if (res >= 2160) resolutionLabel = '4K';
              else if (res >= 1080) resolutionLabel = 'FHD';
              else if (res >= 720) resolutionLabel = 'HD';
              else if (res) resolutionLabel = `SD ${res}p`;
              else resolutionLabel = 'Video';
           }

           const extUpper = (f.ext || 'Unknown').toUpperCase();
           // Just rendering the visual tag (e.g. MP4 FHD), entirely skipping size calculation
           const finalLabel = f.vcodec !== 'none' ? `${extUpper} ${resolutionLabel}` : extUpper;

           return {
             id: f.format_id,
             note: f.format_note,
             ext: f.ext,
             hasVideo: f.vcodec !== 'none',
             hasAudio: f.acodec !== 'none',
             resolution: f.resolution || 'audio only',
             displayLabel: finalLabel // NO MB size appended!
           };
        })
        .filter((v, i, a) => a.findIndex(t => t.resolution === v.resolution && t.hasVideo === v.hasVideo) === i)
        .reverse()
        .slice(0, 10);

      res.json({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats: availableFormats
      });
    } catch (e) {
      console.error('Failed to parse yt-dlp output:', e);
      res.status(500).json({ error: 'Error processing video data.' });
    }
  });
});


app.post('/api/download', (req, res) => {
  const { url, timeFrom, timeTo, formatId, clientId } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const outputFilename = `video_${Date.now()}.mp4`;

  // Strongly prefer MP4 video and M4A audio. Never WEBM.
  const selectedFormat = formatId ? formatId : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
  
  const ytDlpArgs = [
    '-f', selectedFormat,
    '-o', '-',
    '--newline',
    '--force-ipv4',
    '--js-runtimes', 'node',
    '--extractor-args', 'youtube:player_client=android'
  ];

  const isLongFormYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/');
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  if (isLongFormYouTube && fs.existsSync(cookiesPath)) {
    ytDlpArgs.push('--cookies', cookiesPath);
  }

  if (timeFrom || timeTo) {
    const start = timeFrom || '0';
    const end = timeTo || 'inf';
    ytDlpArgs.push('--download-sections', `*${start}-${end}`);
    ytDlpArgs.push('--force-keyframes-at-cuts'); 
  }

  ytDlpArgs.push(url);

  console.log(`Starting INSTANT PIPE stream for: ${url} with args:`, ytDlpArgs);

  // Set headers so the browser treats the incoming byte stream as a downloadable file
  res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Transfer-Encoding', 'chunked');

  const downloadProcess = spawn('yt-dlp', ytDlpArgs);

  // The magic: pipe the raw binary video data straight from yt-dlp to the Express response!
  downloadProcess.stdout.pipe(res);

  downloadProcess.stderr.on('data', (data) => {
    const rawData = data.toString();
    const lines = rawData.split(/[\r\n]+/);
    const text = lines[lines.length - 1].trim() || (lines.length > 1 ? lines[lines.length - 2].trim() : '');
    // typical stdout for yt-dlp: [download]  45.0% of   50.00MiB at    5.00MiB/s ETA 00:05 Wait
    
    // Broadcast to SSE if client provided an ID
    if (clientId && sseClients.has(clientId)) {
      const activeRes = sseClients.get(clientId);
      
      // Simple regex extraction for UI progress bar
      const percentMatch = text.match(/\[download\]\s+([\d.]+)%/);
      let speedMatch = text.match(/at\s+([\d.]+[KMG]?iB\/s)/);
      let sizeMatch = text.match(/of\s+([~]?[\d.]+[KMG]?iB)/);
      let etaMatch = text.match(/ETA\s+([\d:]+)/);

      if (percentMatch) {
         activeRes.write(`data: ${JSON.stringify({
            percent: parseFloat(percentMatch[1]),
            speed: speedMatch ? speedMatch[1] : '',
            size: sizeMatch ? sizeMatch[1].replace('~', '') : '',
            eta: etaMatch ? etaMatch[1] : ''
         })}\n\n`);
      }
    }
    
    console.log(`[YT-DLP] ${text}`);
  });

  downloadProcess.on('close', (code) => {
    console.log(`Pipe stream exit code: ${code}`);
    
    if (clientId && sseClients.has(clientId)) {
       const activeRes = sseClients.get(clientId);
       activeRes.write(`data: ${JSON.stringify({ status: 'completed' })}\n\n`);
       // Note: we don't close the SSE connection here, the client closes it when Done.
    }

    if (code !== 0 && !res.headersSent) {
      // Only send 500 if we haven't already started piping video data
      res.status(500).json({ error: 'Failed to stream video.' });
    }
    res.end();
  });
});

app.get('/api/thumbnail', async (req, res) => {
  console.log("HIT /api/thumbnail");
  const { url } = req.query;
  console.log("URL:", url);
  if (!url) return res.status(400).send('URL is required');

  try {
    console.log("Fetching url...");
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    console.log("Fetch complete. Status:", response.status);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (e) {
    console.error('Proxy error:', e);
    res.status(500).send('Error proxying image');
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
