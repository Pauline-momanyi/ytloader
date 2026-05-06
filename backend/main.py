from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp

app = FastAPI(title="Video Downloader API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    url: str

class VideoInfo(BaseModel):
    title: str
    download_url: str
    thumbnail: str | None = None
    duration: int | None = None
    platform: str | None = None

@app.post("/api/download", response_model=VideoInfo)
async def get_download_link(request: DownloadRequest):
    # yt-dlp configuration to extract URL without downloading to disk
    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info
            info_dict = ydl.extract_info(request.url, download=False)
            
            if not info_dict:
                raise ValueError("Could not extract video information.")
                
            # If it's a playlist, get the first entry
            if 'entries' in info_dict:
                if len(info_dict['entries']) > 0:
                    video = info_dict['entries'][0]
                else:
                    raise ValueError("Playlist is empty.")
            else:
                video = info_dict

            return VideoInfo(
                title=video.get('title', 'Unknown Title'),
                download_url=video.get('url'),
                thumbnail=video.get('thumbnail'),
                duration=video.get('duration'),
                platform=video.get('extractor')
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
