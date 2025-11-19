import React, { useState } from 'react';
import { GUIDE_STEPS } from './constants';
import { GuideCard } from './components/GuideCard';
import { SqlSimulator } from './components/SqlSimulator';
import { DeploymentGuide } from './components/DeploymentGuide';
import { Tab } from './types';
import { Database, BookOpen, Terminal, Rocket } from 'lucide-react';

const App: React.FC = () => {
  // Start with SIMULATOR tab by default as requested
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SIMULATOR);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MS SQL Connector Guide
            </h1>
          </div>
          
          <nav className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab(Tab.GUIDE)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === Tab.GUIDE 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">가이드</span>
            </button>
            <button
              onClick={() => setActiveTab(Tab.SIMULATOR)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === Tab.SIMULATOR 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">시뮬레이터</span>
            </button>
            <button
              onClick={() => setActiveTab(Tab.DEPLOY)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === Tab.DEPLOY 
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">배포 (Deploy)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === Tab.GUIDE && (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold text-white">
                React에서 MS SQL 연결하는 방법
              </h2>
              <p className="text-slate-400 text-lg">
                웹 브라우저는 보안상의 이유로 데이터베이스에 직접 접속할 수 없습니다.<br/>
                아래 <span className="text-blue-400 font-semibold">5단계 순서(Step-by-Step)</span>를 따라 안전한 연결 구조를 구축하세요.
              </p>
            </div>

            {/* Step List (Vertical Timeline Layout) */}
            <div className="max-w-4xl mx-auto space-y-6 relative">
               {/* Background line for larger screens */}
               <div className="absolute left-[2.75rem] top-6 bottom-6 w-0.5 bg-slate-800 hidden md:block -z-10" />

               {GUIDE_STEPS.map((step) => (
                 <div key={step.id} className="relative">
                   <GuideCard step={step} />
                 </div>
               ))}
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mt-8 max-w-4xl mx-auto">
              <h3 className="text-amber-400 font-semibold mb-2">💡 핵심 요약</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
                <li>클라이언트(React)는 오직 API 서버와 통신합니다.</li>
                <li>실제 DB 접속은 백엔드 서버(Node.js, Python 등)에서 이루어집니다.</li>
                <li>이 순서를 지키지 않고 브라우저에서 바로 DB에 접속하려 하면 보안 문제가 발생합니다.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === Tab.SIMULATOR && (
          <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                 <h2 className="text-3xl font-bold text-white mb-3">SQL Query Simulator</h2>
                 <p className="text-slate-400">
                   이곳은 React 앱이 백엔드와 통신하는 과정을 시뮬레이션하는 공간입니다.
                   실제 DB는 없지만, Gemini가 작성한 SQL 쿼리가 어떻게 동작할지 미리 확인해보세요.
                 </p>
              </div>
              <SqlSimulator />
            </div>
          </div>
        )}

        {activeTab === Tab.DEPLOY && (
          <DeploymentGuide />
        )}
      </main>
      
      <footer className="border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>© 2025 SQL Connector Guide. Built with React & Tailwind.</p>
      </footer>
    </div>
  );
};

export default App;