
import React, { useState, useEffect } from 'react';
import { SqlSimulator } from './components/SqlSimulator';
import { Database, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      };
      setCurrentTime(new Intl.DateTimeFormat('ko-KR', options).format(now));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-rose-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2 rounded-lg shadow-lg shadow-rose-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Winpos3
              </h1>
            </div>
          </div>
          {/* KST Clock Display */}
          <div className="hidden sm:flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime} (KST)</span>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          <SqlSimulator />
        </div>
      </main>
      <footer className="border-t border-slate-200 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>© 2025 Winpos3 System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
