export const Steps = () => {
  return (
    <section className="w-full max-w-5xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-8">
        <div className="w-full md:w-1/2 relative">
          <div className="absolute inset-0 bg-primary/10 transform rotate-3 rounded-3xl -z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80" 
            alt="Excited user" 
            className="w-full h-auto rounded-3xl object-cover aspect-[4/3] shadow-lg"
          />
        </div>
        <div className="w-full md:w-1/2">
          <span className="text-dark/50 dark:text-light/50 text-xs font-semibold tracking-widest uppercase block mb-1">How to use</span>
          <h2 className="text-3xl font-bold text-dark dark:text-light mb-6">
            <span className="text-primary font-black">YouTube</span> Downloader
          </h2>
          
          <div className="space-y-6">
            {[
              { num: '01', title: 'Find Video', desc: 'Find the video you want from among the videos available on YouTube and copy its link.' },
              { num: '02', title: 'Paste Video', desc: 'Paste the copied link in the desired box and wait for the system to display the desired video download links.' },
              { num: '03', title: 'Download Video', desc: 'Just in the last step, click on download from the displayed list and download the desired video and save it on your device.' }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-base shadow-sm ${i === 1 ? 'bg-primary text-white' : 'bg-white dark:bg-[#2C2C2E] text-primary border border-primary/20 dark:border-primary/40'}`}>
                  {step.num}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark dark:text-light mb-1">{step.title}</h3>
                  <p className="text-dark/60 dark:text-light/60 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        {[
          { num: '01', text: 'No installation required. Instantly download videos directly from your browser.' },
          { num: '02', text: 'Extract specific scenes! Use our Timestamp Range to grab exactly what you need.' },
          { num: '03', text: 'Your privacy is guaranteed. We do not store any logs of your download history.' }
        ].map((block, i) => (
          <div key={i} className="bg-dark dark:bg-[#1A1A1C] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
            <div className="text-5xl font-black text-white/5 absolute -top-2 -right-2">
              {block.num}
            </div>
            <div className="text-2xl font-mono text-white/20 mb-3">{block.num}</div>
            <p className="text-xs text-white/80 leading-relaxed max-w-[180px]">{block.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
