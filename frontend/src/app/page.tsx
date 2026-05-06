"use client";

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Steps } from '../components/Steps';
import { Features } from '../components/Features';
import { FAQ } from '../components/FAQ';

export default function Home() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const scrollToContact = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    setTimeout(() => {
      setFormStatus('sent');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <>
      <Header />
      
      <main>
        <Hero />
        
        {/* About section / Free Video Downloader */}
        <section className="text-center py-10 px-4 mt-2">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Free <span className="text-white bg-primary px-3 py-1 rounded-xl shadow-md transform -rotate-2 inline-block">YouTube</span>
            <br className="md:hidden" /> Video Downloader
          </h2>
          <p className="text-dark/60 dark:text-light/60 text-xs md:text-sm max-w-xl mx-auto mb-6 mt-4">
            With This Platform, You Can Easily Download Any Video<br/>From YouTube For Free
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
            <button onClick={scrollToContact} className="opacity-60 hover:opacity-100 transition-opacity">Contact Us</button>
            <button onClick={scrollToContact} className="bg-dark dark:bg-light dark:text-dark text-white rounded-full px-5 py-2 hover:bg-dark/80 dark:hover:bg-light/80 transition-colors flex items-center gap-2">
              Learn More <span className="opacity-50 text-[10px]">→</span>
            </button>
          </div>
        </section>

        <Steps />
        <Features />
        <FAQ />

        {/* Contact Form Section */}
        <section id="contact-form" className="w-full max-w-2xl mx-auto py-16 px-4">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-3xl p-8 shadow-xl border border-dark/5 dark:border-light/5">
            <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
            <p className="text-sm text-dark/60 dark:text-light/60 mb-6">Have questions or feedback? Send us a message.</p>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-80">Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-light/50 dark:bg-dark/50 border border-dark/10 dark:border-light/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-80">Email</label>
                <input 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-light/50 dark:bg-dark/50 border border-dark/10 dark:border-light/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-80">Message</label>
                <textarea 
                  required 
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-light/50 dark:bg-dark/50 border border-dark/10 dark:border-light/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 transition-all resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button 
                type="submit" 
                disabled={formStatus !== 'idle'}
                className="w-full bg-primary hover:bg-[#b91e1e] disabled:bg-primary/50 text-white font-medium rounded-xl py-3 transition-colors flex justify-center items-center"
              >
                {formStatus === 'idle' && 'Send Message'}
                {formStatus === 'sending' && 'Sending...'}
                {formStatus === 'sent' && 'Message Sent! ✓'}
              </button>
            </form>
          </div>
        </section>

      </main>

      <footer className="w-full max-w-7xl mx-auto py-6 px-4 flex flex-col md:flex-row items-center justify-between border-t border-dark/10 dark:border-light/10 mt-4">
        <p className="text-dark/40 dark:text-light/40 text-[10px] font-semibold mb-3 md:mb-0">
          © 2026-2027 YTLoader Downloader
        </p>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-dark dark:text-light">YTLoader</span>
        </div>
        <div className="flex gap-4 text-[10px] font-semibold text-dark/40 dark:text-light/40 mt-3 md:mt-0">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms Of Services</a>
          <button onClick={scrollToContact} className="hover:text-primary transition-colors text-dark dark:text-light">Contact Us</button>
        </div>
      </footer>
    </>
  );
}
