"use client";
import { Zap, Clock, Infinity as InfinityIcon, MonitorSmartphone } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-5 h-5 text-primary" />,
    title: "High Quality",
    desc: "You can download videos from your favorite social platforms without losing quality. In just a short time, videos can be downloaded in MP4 and even MP3 formats."
  },
  {
    icon: <Clock className="w-5 h-5 text-primary" />,
    title: "Fast Downloading",
    desc: "Using YTLoader, quickly download videos from YouTube, TikTok, Instagram & more with just a few simple clicks. Without wasting any time or paying extra fees."
  },
  {
    icon: <InfinityIcon className="w-5 h-5 text-primary" />,
    title: "Unlimited Download",
    desc: "Through this platform, you can download the videos you want at any time and without limiting the number of downloads. Transfer speed is up to 1GB/S."
  },
  {
    icon: <MonitorSmartphone className="w-5 h-5 text-primary" />,
    title: "Support All Devices",
    desc: "YTLoader is a website-based and online platform that you can use on any operating system, including Windows, Linux, iPhone, and Android."
  }
];

export const Features = () => {
  return (
    <section className="w-full max-w-6xl mx-auto py-10 px-4 text-center">
      <div className="mb-10">
        <span className="text-dark/50 dark:text-light/50 text-xs font-semibold tracking-widest uppercase block mb-1">Why To Choose</span>
        <h2 className="text-2xl md:text-4xl font-bold text-dark dark:text-light">
          <span className="text-primary italic font-black">YTDownloader</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {features.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-[#2C2C2E] p-6 rounded-2xl shadow-sm border border-dark/5 dark:border-light/5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {item.icon}
            </div>
            <h3 className="text-base font-bold text-dark dark:text-light mb-2">{item.title}</h3>
            <p className="text-dark/60 dark:text-light/60 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
