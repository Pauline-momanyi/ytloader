import { useEffect, useState } from 'react';
import { Video, Globe, ChevronDown, Moon, Sun } from 'lucide-react';

export const Header = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="flex justify-between items-center py-4 px-4 md:px-12 w-full max-w-7xl mx-auto z-10 relative">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Video className="text-primary w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight dark:text-light">YTLoader</span>
        </div>
        <span className="text-[10px] text-dark/50 dark:text-light/50 font-medium ml-10 -mt-1 tracking-wider uppercase">Free Downloader</span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="p-2 rounded-full border border-dark/10 dark:border-light/10 hover:bg-dark/5 dark:hover:bg-light/5 transition-colors text-dark dark:text-light"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2 text-sm text-dark dark:text-light hover:text-primary dark:hover:text-primary cursor-pointer transition-colors px-4 py-2 rounded-full border border-dark/10 dark:border-light/10 bg-white/50 dark:bg-dark/50 backdrop-blur-sm">
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-medium">English</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </div>
      </div>
    </header>
  );
};
