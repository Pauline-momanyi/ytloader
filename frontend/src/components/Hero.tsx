"use client";
import React, { useState } from 'react';
import { Download, Monitor, Smartphone, Youtube, Instagram, Facebook, Link2, AlertCircle, Loader2, Music, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateTimestamp } from '../utils/validation';

export const Hero = () => {
  const [url, setUrl] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isVideoFound, setIsVideoFound] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{percent: number, speed: string, size: string, eta: string} | null>(null);
  
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState('');

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    if (!newUrl.trim() || !newUrl.startsWith('http')) {
       setShowPreview(false);
       setThumbnail(null);
       setIsVideoFound(false);
       setIsFetchingInfo(false);
       setVideoInfo(null);
       return;
    }

    // --- INSTANT CLIENT-SIDE VALIDATION ---
    // If the link is obviously not from a supported platform, kill it instantly before hitting the backend
    const isSupported = 
      newUrl.includes('youtube.com') || 
      newUrl.includes('youtu.be') || 
      newUrl.includes('instagram.com') || 
      newUrl.includes('facebook.com') || 
      newUrl.includes('tiktok.com');

    if (!isSupported) {
       toast.error('Unsupported URL. Please enter a valid YouTube, Instagram, Facebook, or TikTok link.');
       setShowPreview(true);
       setThumbnail(null);
       setIsVideoFound(false);
       setIsFetchingInfo(false);
       setVideoInfo(null);
       return;
    }

    setShowPreview(true);
    setIsFetchingInfo(true);
    setVideoInfo(null);
    setTimeFrom('');
    setTimeTo('');

    // --- INSTANT UX (REGEX FALLBACK) ---
    // Instantly provide a thumbnail and allow the user to click Download immediately
    let foundViaRegex = false;
    if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
       const videoIdMatch = newUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})/);
       if (videoIdMatch && videoIdMatch[1]) {
         setThumbnail(`https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`);
         foundViaRegex = true;
       }
    } else if (newUrl.includes('instagram.com/')) {
       setThumbnail('https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80');
       foundViaRegex = true;
    } else if (newUrl.includes('facebook.com/')) {
       setThumbnail('https://images.unsplash.com/photo-1611162617215-6ac219488a91?w=800&q=80');
       foundViaRegex = true;
    } else if (newUrl.includes('tiktok.com')) {
       setThumbnail('https://images.unsplash.com/photo-1611162618758-6a2e94ffebcb?w=800&q=80');
       foundViaRegex = true;
    }

    if (foundViaRegex) {
       setIsVideoFound(true);
    }

    // --- ASYNC BACKGROUND METADATA FETCHING ---
    // Silently fetch formats in the background without blocking the UI
    try {
      const res = await fetch('http://localhost:3001/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      
      const data = await res.json();

      if (!res.ok) {
         throw new Error(data.error || 'Failed to fetch video information.');
      }
      
      setVideoInfo(data);
      
      // If the backend found a real thumbnail, swap it in smoothly
      if (data.thumbnail) {
        setThumbnail(data.thumbnail);
      }
      setIsVideoFound(true);

      if (data.formats && data.formats.length > 0) {
        const bestFormat = data.formats.find((f: any) => f.hasVideo && f.hasAudio) || data.formats[0];
        setSelectedFormat(bestFormat.id);
      }
    } catch (err: any) {
       console.error("Background info fetch failed", err);
       // If the backend failed, it's a bad link or a private video, regardless of regex.
       setIsVideoFound(false);
       setThumbnail(null);
       toast.error(err.message || 'The URL provided is not supported or the video is private.');
    } finally {
       setIsFetchingInfo(false);
    }
  };

  const handleDownload = async (overrideFormatId?: string) => {
    if (!url) {
      toast.error('Please enter a valid video URL first.');
      return;
    }

    if (timeFrom || timeTo) {
      const validation = validateTimestamp(timeFrom, timeTo, videoInfo?.duration);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid timestamp range');
        return;
      }
    }

    setIsDownloading(true);
    setDownloadProgress(null);

    // Generate a unique client ID for this specific download session
    const clientId = Date.now().toString() + Math.random().toString(36).substring(7);

    // Open Server-Sent Events connection to listen for progress
    const eventSource = new EventSource(`http://localhost:3001/api/progress/${clientId}`);
    eventSource.onmessage = (event) => {
       try {
          const data = JSON.parse(event.data);
          if (data.status === 'completed') {
             eventSource.close();
          } else {
             setDownloadProgress(data);
          }
       } catch (e) {
          console.error("Failed to parse progress event", e);
       }
    };
    eventSource.onerror = () => {
       eventSource.close();
    };

    try {
      const payload = { 
        url, 
        timeFrom,
        timeTo,
        formatId: overrideFormatId || selectedFormat,
        clientId
      };

      const response = await fetch('http://localhost:3001/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        eventSource.close();
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download video');
      }

      const blob = await response.blob();
      eventSource.close();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Download finished successfully!');

    } catch (err: any) {
      console.error(err);
      eventSource.close();
      toast.error(err.message || 'An error occurred during download.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(null), 3000);
    }
  };

  return (
    <section className="relative w-full max-w-5xl mx-auto mt-8 px-4 flex flex-col items-center text-center z-10 animate-fade-in">
      
      {/* Decorative gradient blur in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-64 bg-primary/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-dark/50 border border-dark/10 dark:border-light/10 shadow-sm mb-4">
        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        <span className="text-xs font-semibold text-dark/70 dark:text-light/70 uppercase tracking-wider">Online Video</span>
      </div>

      <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-dark dark:text-light mb-3">
        Downloader
      </h1>
      
      <p className="text-dark/60 dark:text-light/60 max-w-2xl mx-auto mb-6 text-sm md:text-base">
        Do Not Look Any Further! Explore Our <span className="font-semibold text-primary">YTLoader</span> Video Downloader, 
        A Free Solution To Quickly Download Videos Or Music With Just One Click!
      </p>

      {/* Input Form Area */}
      <div className="w-full max-w-3xl relative">
        <div className="bg-white dark:bg-[#2C2C2E] p-2 rounded-2xl shadow-lg border border-dark/5 dark:border-light/5 flex flex-col md:flex-row gap-2 transition-all duration-300 focus-within:ring-2 ring-primary/20">
          
          <div className="flex-grow flex items-center bg-light/50 dark:bg-dark/50 rounded-xl px-4 py-2 border border-dark/5 dark:border-light/5 min-w-[200px]">
            <Link2 className="text-dark/40 dark:text-light/40 w-5 h-5 mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Insert Youtube, Instagram or Facebook Link..."
              className="w-full bg-transparent outline-none text-dark dark:text-light placeholder:text-dark/40 dark:placeholder:text-light/40 text-sm"
              value={url}
              onChange={handleUrlChange}
            />
          </div>

          {/* Conditional Format Selector */}
          {isFetchingInfo ? (
            <div className="flex items-center shrink-0 min-w-[150px] justify-center bg-light/50 dark:bg-dark/50 rounded-xl px-3 py-2 border border-dark/5 dark:border-light/5 text-dark/50 dark:text-light/50 text-xs font-semibold">
               <Loader2 className="w-3 h-3 mr-2 animate-spin" />
               Loading...
            </div>
          ) : videoInfo && videoInfo.formats && videoInfo.formats.length > 0 && (
            <div className="flex items-center shrink-0">
               <select 
                 value={selectedFormat} 
                 onChange={(e) => setSelectedFormat(e.target.value)}
                 className="h-full bg-light/50 dark:bg-dark/50 rounded-xl px-3 py-2 border border-dark/5 dark:border-light/5 outline-none text-dark dark:text-light text-xs font-semibold cursor-pointer min-w-[150px]"
                 title="Select Quality / Format"
               >
                 {videoInfo.formats.map((f: any) => (
                   <option key={f.id} value={f.id}>
                     {f.displayLabel || f.resolution} {f.hasVideo && f.hasAudio ? '🎥🔊' : f.hasVideo ? '🎥' : '🔊'}
                   </option>
                 ))}
               </select>
            </div>
          )}

          <button 
            onClick={() => handleDownload()}
            disabled={isDownloading || !isVideoFound}
            className="bg-primary hover:bg-[#b91e1e] disabled:bg-primary/50 text-white px-6 py-2 md:py-3 rounded-xl font-semibold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 group shrink-0 text-sm md:text-base min-w-[140px]"
          >
            {isDownloading ? (
               <span className="animate-pulse">Processing...</span>
             ) : (
               <>
                 <Download className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-y-0.5 transition-transform" />
                 <span className="hidden md:inline">Download</span>
               </>
             )}
          </button>
        </div>
      </div>

      {/* Quick Download Options */}
      {showPreview && isVideoFound && (
         <div className="flex items-center gap-3 mt-4 animate-slide-up bg-white dark:bg-[#2C2C2E] p-2 rounded-xl shadow-md border border-dark/5 dark:border-light/5">
            <span className="text-xs font-semibold opacity-60 px-2 hidden sm:block">Quick Download:</span>
            <button 
              onClick={() => handleDownload('bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best')}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-dark/5 hover:bg-dark/10 dark:bg-light/10 dark:hover:bg-light/20 text-dark dark:text-light px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
               <VideoIcon className="w-4 h-4 text-primary" /> MP4 Video
            </button>
            <button 
              onClick={() => handleDownload('bestaudio[ext=m4a]/bestaudio/best')}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-dark/5 hover:bg-dark/10 dark:bg-light/10 dark:hover:bg-light/20 text-dark dark:text-light px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
               <Music className="w-4 h-4 text-blue-500" /> MP3/M4A Audio
            </button>
         </div>
      )}

      {/* Thumbnail Display */}
      {showPreview && (
         <div className={`w-full max-w-2xl mx-auto mt-8 rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-[#2C2C2E] animate-slide-up relative group flex flex-col items-center justify-center min-h-[250px] ${isVideoFound ? 'bg-dark/5' : 'bg-primary/5 dark:bg-primary/10'}`}>
            {isVideoFound ? (
              <>
                {/* Standard Hover OR Downloading State Overlay */}
                <div className={`absolute inset-0 bg-dark/60 transition-opacity flex flex-col items-center justify-center z-10 backdrop-blur-[2px] gap-4 ${isDownloading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                   {isDownloading ? (
                      <div className="w-4/5 max-w-sm flex flex-col items-center animate-fade-in">
                         <div className="flex justify-between w-full text-white text-xs font-bold mb-2 px-1">
                            <span>{downloadProgress?.percent ? `${downloadProgress.percent}%` : 'Starting pipe...'}</span>
                            {downloadProgress?.speed && <span className="text-white/70 font-medium hidden sm:inline">{downloadProgress.speed}</span>}
                            <span>{downloadProgress?.eta ? `ETA ${downloadProgress.eta}` : ''}</span>
                         </div>
                         <div className="w-full bg-dark/50 rounded-full h-3 border border-white/10 overflow-hidden shadow-inner">
                            <div 
                              className="bg-primary h-full rounded-full transition-all duration-300 relative overflow-hidden" 
                              style={{ width: `${downloadProgress?.percent || 5}%` }}
                            >
                               <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                            </div>
                         </div>
                         {downloadProgress?.size && <div className="text-white/60 text-[10px] mt-2 font-medium tracking-wide">Fetching {downloadProgress.size}</div>}
                      </div>
                   ) : (
                      <div className="flex gap-4">
                         <button onClick={() => handleDownload()} className="bg-white/90 text-dark p-4 rounded-full shadow-xl hover:scale-110 transition-transform" title="Standard Download">
                            <Download className="w-6 h-6 text-primary" />
                         </button>
                         {thumbnail && (
                           <button onClick={() => window.open(thumbnail, '_blank')} className="bg-white/90 text-dark p-4 rounded-full shadow-xl hover:scale-110 transition-transform" title="Download High-Res Thumbnail">
                              <ImageIcon className="w-6 h-6 text-green-600" />
                           </button>
                         )}
                      </div>
                   )}
                </div>
                {thumbnail && <img src={thumbnail} alt="Video Preview" className="w-full h-auto max-h-[300px] object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                <div className="absolute top-4 left-4 bg-green-500/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md z-20 backdrop-blur-sm max-w-[200px] truncate text-left">
                  {videoInfo?.title ? videoInfo.title : 'Video Found ✓'}
                </div>
                {/* Loading formats indicator overlay */}
                {isFetchingInfo && (
                   <div className="absolute bottom-4 left-4 bg-dark/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md z-20 backdrop-blur-sm flex items-center gap-2">
                     <Loader2 className="w-3 h-3 animate-spin" />
                     Fetching formats...
                   </div>
                )}
              </>
            ) : isFetchingInfo ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-primary text-center">
                 <Loader2 className="w-12 h-12 mb-3 opacity-80 animate-spin" />
                 <p className="font-semibold text-sm">Fetching Video Formats...</p>
                 <p className="text-xs opacity-70 mt-1 max-w-xs text-dark dark:text-light">
                    Retrieving available resolutions and thumbnail...
                 </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-primary text-center">
                 <AlertCircle className="w-12 h-12 mb-3 opacity-80" />
                 <p className="font-semibold text-sm">Video Not Found</p>
                 <p className="text-xs opacity-70 mt-1 max-w-xs text-dark dark:text-light">
                    The URL provided does not seem to point to a valid YouTube, Instagram, or Facebook video. Please check the link and try again.
                 </p>
              </div>
            )}
         </div>
      )}

      {/* Timestamp Selection Area */}
      {showPreview && isVideoFound && (
        <div className="w-full max-w-2xl mx-auto mt-4 flex flex-col items-center bg-white dark:bg-[#2C2C2E] p-4 rounded-xl shadow border border-dark/5 dark:border-light/5 animate-fade-in">
          <p className="text-sm text-dark/70 dark:text-light/70 font-medium mb-3">
            Want to download a particular timestamp? Then enter the times below...
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-2/3 justify-center">
             <input 
               type="text" 
               placeholder="From (HH:MM:SS or MM:SS)"
               title="Start Timestamp (HH:MM:SS or MM:SS)"
               className="w-full sm:w-1/2 bg-light/50 dark:bg-dark/50 rounded-lg px-3 py-2 border border-dark/10 dark:border-light/10 outline-none text-dark dark:text-light placeholder:text-dark/40 dark:placeholder:text-light/40 text-center text-sm focus:ring-2 ring-primary/20"
               value={timeFrom}
               onChange={(e) => setTimeFrom(e.target.value)}
             />
             <input 
               type="text" 
               placeholder="To (HH:MM:SS or MM:SS)"
               title="End Timestamp (HH:MM:SS or MM:SS)"
               className="w-full sm:w-1/2 bg-light/50 dark:bg-dark/50 rounded-lg px-3 py-2 border border-dark/10 dark:border-light/10 outline-none text-dark dark:text-light placeholder:text-dark/40 dark:placeholder:text-light/40 text-center text-sm focus:ring-2 ring-primary/20"
               value={timeTo}
               onChange={(e) => setTimeTo(e.target.value)}
             />
          </div>
        </div>
      )}

      {/* Supported Platforms */}
      <div className="mt-8 bg-dark dark:bg-[#2C2C2E] text-white rounded-full px-6 py-3 flex items-center gap-4 md:gap-6 shadow-xl">
        <span className="text-xs md:text-sm font-medium opacity-80">Supported :</span>
        <div className="flex gap-4">
          <Youtube className="w-4 h-4 md:w-5 md:h-5 hover:text-primary transition-colors cursor-pointer" />
          <Instagram className="w-4 h-4 md:w-5 md:h-5 hover:text-pink-500 transition-colors cursor-pointer" />
          <Facebook className="w-4 h-4 md:w-5 md:h-5 hover:text-blue-500 transition-colors cursor-pointer" />
          <Monitor className="w-4 h-4 md:w-5 md:h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
          <Smartphone className="w-4 h-4 md:w-5 md:h-5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
        </div>
      </div>
      
    </section>
  );
};
