import React from 'react';
import { GuideStep } from '../types';
import { Server, Database, Code, Lock, Globe, Rocket } from 'lucide-react';

interface GuideCardProps {
  step: GuideStep;
}

const iconMap: Record<string, React.ReactNode> = {
  server: <Server className="w-5 h-5" />,
  database: <Database className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  rocket: <Rocket className="w-5 h-5" />,
};

export const GuideCard: React.FC<GuideCardProps> = ({ step }) => {
  return (
    <div className="group relative bg-slate-800/40 border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-blue-500/50 transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Step Number Column */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-900 border-2 border-blue-500/30 text-blue-400 font-bold text-xl shadow-lg group-hover:scale-110 group-hover:border-blue-500 transition-all duration-300 z-10">
            {step.id}
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300 transition-colors">
              {iconMap[step.icon]}
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">
              {step.title}
            </h3>
          </div>

          <p className="text-slate-300 leading-relaxed mb-4 text-base">
            {step.description}
          </p>

          {step.codeSnippet && (
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 overflow-x-auto group-hover:border-slate-700 transition-colors">
              <pre className="text-sm font-mono text-blue-300/90 leading-relaxed">
                {step.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};