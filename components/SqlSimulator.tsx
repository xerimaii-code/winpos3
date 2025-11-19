import React, { useState } from 'react';
import { Search, Play, Database, Loader2, Sparkles, Code, Wifi, WifiOff, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { generateSqlFromNaturalLanguage } from '../services/geminiService';
import { QueryResult } from '../types';

export const SqlSimulator: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [useRealApi, setUseRealApi] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMsg, setConnectionMsg] = useState('');

  // Function to test simple connectivity without AI
  const handleTestConnection = async () => {
    if (!useRealApi) {
      setConnectionStatus('error');
      setConnectionMsg('실제 서버 모드를 켜주세요.');
      return;
    }

    setTestLoading(true);
    setConnectionStatus('idle');
    setResult(null);

    try {
      const testQuery = "SELECT @@VERSION as version";
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      if (json.data && json.data.length > 0) {
        setConnectionStatus('success');
        setConnectionMsg(`Connected! Server: ${json.data[0].version.substring(0, 40)}...`);
        setResult({
            sql: testQuery,
            data: json.data
        });
      } else {
        throw new Error("No data returned from DB");
      }
    } catch (e) {
      setConnectionStatus('error');
      setConnectionMsg(`Connection Failed: ${(e as Error).message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setConnectionStatus('idle');

    try {
      // 1. Get SQL from Gemini
      const sql = await generateSqlFromNaturalLanguage(input);

      if (useRealApi) {
        // --- REAL API MODE ---
        try {
          const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sql })
          });
          
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with ${response.status}`);
          }

          const json = await response.json();
          setResult({
            sql,
            data: json.data || [],
          });
        } catch (apiErr) {
           setResult({
            sql,
            data: [],
            error: `API Error: ${(apiErr as Error).message}.\n(Check Vercel Logs or Environment Variables)`
          });
        }
      } else {
        // --- MOCK SIMULATION MODE ---
        await new Promise(resolve => setTimeout(resolve, 800));

        let filteredData = [...MOCK_USERS];
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('top') || lowerInput.includes('limit')) {
          filteredData = filteredData.slice(0, 2);
        }
        if (lowerInput.includes('admin')) {
          filteredData = filteredData.filter(u => u.role === 'Admin');
        }
        if (lowerInput.includes('lee') || lowerInput.includes('younghee')) {
          filteredData = filteredData.filter(u => u.name.includes('Lee') || u.name.includes('이영희'));
        }

        setResult({
          sql,
          data: filteredData,
        });
      }

    } catch (err) {
      setResult({
        sql: '-- Error generating SQL',
        data: [],
        error: 'Failed to process request via Gemini'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-600/20 text-purple-400 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">AI SQL Query Simulator</h3>
              <p className="text-slate-400 mt-1 text-sm">
                자연어를 SQL로 변환하여 실행합니다.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {useRealApi && (
              <button
                onClick={handleTestConnection}
                disabled={testLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium whitespace-nowrap"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                연결 테스트 (Ping)
              </button>
            )}

            <button
              onClick={() => setUseRealApi(!useRealApi)}
              className={`flex items-center justify-center gap-3 px-4 py-2 rounded-lg border transition-all duration-300 text-sm font-medium ${
                useRealApi 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {useRealApi ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {useRealApi ? '실제 서버 (Real API)' : '가상 데이터 (Mock)'}
            </button>
          </div>
        </div>

        {/* Connection Status Message */}
        {useRealApi && connectionStatus !== 'idle' && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                connectionStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
                {connectionStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span className="truncate">{connectionMsg}</span>
            </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
            placeholder={useRealApi ? "실제 DB 테이블명으로 검색하세요 (예: select * from users)" : "예: '관리자(Admin) 권한을 가진 사용자 보여줘'"}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-4 pl-12 pr-24 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <button
            onClick={handleSimulate}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            실행
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 font-mono mt-1">Try:</span>
          {['모든 사용자 보여줘', 'Admin 유저만 찾아줘', '최근 2명만 보여줘'].map(prompt => (
            <button 
              key={prompt}
              onClick={() => setInput(prompt)}
              className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Generated SQL View */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
              <Code className="w-4 h-4 text-green-400" />
              <span className="text-sm font-mono text-slate-300">Generated T-SQL Query</span>
            </div>
            <div className="p-4 font-mono text-sm text-green-300 overflow-auto flex-1 whitespace-pre-wrap">
              {result.sql}
            </div>
            <div className="bg-slate-950/50 px-4 py-2 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
               <span>Generated by Gemini 2.5 Flash</span>
               <span>{useRealApi ? 'Target: Real API' : 'Target: Mock Data'}</span>
            </div>
          </div>

          {/* Result Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-mono text-slate-300">
                {result.error ? 'Error' : 'Result Set'}
              </span>
            </div>
            <div className="p-0 overflow-auto flex-1 min-h-[200px]">
              {result.error ? (
                <div className="p-6 text-red-400 text-sm font-mono whitespace-pre-wrap">
                  {result.error}
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                    <tr>
                      {result.data.length > 0 ? Object.keys(result.data[0]).map(key => (
                        <th key={key} className="px-4 py-3 whitespace-nowrap">{key}</th>
                      )) : (
                        <th className="px-4 py-3">Result</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {result.data.length > 0 ? result.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="px-4 py-3 max-w-xs truncate">
                             {val === null ? 'NULL' : val?.toString()}
                          </td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
