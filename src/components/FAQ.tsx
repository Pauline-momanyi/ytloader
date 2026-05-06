import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const questions = [
  { q: "What is YTLoader?", a: "It is a free online tool to grab videos seamlessly." },
  { q: "Is YTLoader free?", a: "Yes, our service is 100% free to use." },
  { q: "Where are the downloaded videos stored?", a: "These videos will be saved in the 'Downloads' folder in your phone or the 'download history' section of your browser." },
  { q: "Can we download unlimited?", a: "Yes, there are no limits on the number of downloads." }
];

export const FAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="w-full max-w-4xl mx-auto py-10 px-4">
      <div className="bg-dark dark:bg-[#1A1A1C] rounded-[2rem] p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -z-0"></div>

        <div className="relative z-10 mb-8 text-center md:text-left">
          <span className="text-white/60 text-xs font-medium tracking-widest uppercase block mb-1">Frequently</span>
          <h2 className="text-3xl md:text-4xl font-bold">
            Asked <span className="text-primary bg-white px-3 py-1 rounded-xl inline-block -rotate-2 ml-1 shadow-md">Questions</span>
          </h2>
        </div>

        <div className="space-y-3 relative z-10">
          {questions.map((faq, idx) => (
            <div 
              key={idx} 
              className={`border border-white/10 rounded-xl overflow-hidden transition-all duration-300 ${openIdx === idx ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}`}
            >
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/40 font-mono text-xs group-hover:text-white transition-colors">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span className="font-medium text-sm">{faq.q}</span>
                </div>
                {openIdx === idx ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
              </button>
              
              <div 
                className={`px-4 text-white/60 text-xs leading-relaxed transition-all duration-300 overflow-hidden ${openIdx === idx ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="pl-7">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
