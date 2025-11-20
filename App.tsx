
import React from 'react';
import { SqlSimulator } from './components/SqlSimulator';
import { Database } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Winpos3
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                  v8.0 (Deep Learning)
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation removed as requested - only Simulator active */}
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
