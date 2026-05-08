import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "YTLoader - Universal Video Downloader",
  description: "Easily download any video from YouTube, TikTok, Instagram, and Facebook for free with YTLoader.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-light dark:bg-dark text-dark dark:text-light font-sans overflow-x-hidden selection:bg-primary/20 transition-colors duration-300">
        <Toaster position="top-center" toastOptions={{ className: 'dark:bg-[#2C2C2E] dark:text-light border border-dark/10 dark:border-light/10 shadow-xl' }} />
        {children}
      </body>
    </html>
  );
}
