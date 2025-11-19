import React, { useState, useEffect, useCallback } from 'react';
import { Search, Play, Database, Loader2, Sparkles, Code, Wifi, WifiOff, Activity, CheckCircle2, XCircle, HelpCircle, Server } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { generateSqlFromNaturalLanguage } from '../services/geminiService';
import { QueryResult } from '../types';

export const SqlSimulator: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  // Set default to TRUE for auto-connection
  const [useRealApi, setUseRealApi] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMsg, setConnectionMsg] = useState('');
  const [connectedDbName, setConnectedDbName] = useState<string>('');

  // Function to test connectivity
  const handleTestConnection = useCallback(async () => {
    if (!useRealApi) return;

    setTestLoading(true);
    setConnectionStatus('idle');
    setResult(null);
    setConnectedDbName('');

    // 타임아웃 15초로 연장
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // 1. 연결 및 DB 이름 확인 쿼리
      const testQuery = "SELECT @@VERSION as version, DB_NAME() as current_db";
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      if (json.data && json.data.length > 0) {
        setConnectionStatus('success');
        
        const dbName = json.data[0].current_db || 'Unknown';
        const serverVersion = json.data[0].version.split('\n')[0].substring(0, 30);
        
        setConnectedDbName(dbName);
        setConnectionMsg(`Server: ${serverVersion}...`);
        
        // 2. 연결 성공 시 테이블 목록 조회
        const tableQuery = "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME";
        const tableResponse = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: tableQuery }),
            signal: controller.signal
        });

        if (tableResponse.ok) {
            const tableJson = await tableResponse.json();
            setResult({
                sql: tableQuery,
                data: tableJson.data
            });
        } else {
            setResult({
                sql: testQuery,
                data: json.data
            });
        }
      } else {
        throw new Error("No data returned from DB");
      }
      
      clearTimeout(timeoutId);
    } catch (e: any) {
      setConnectionStatus('error');
      
      if (e.name === 'AbortError') {
        setConnectionMsg('연결 시간 초과 (Timeout).\n서버가 응답하지 않습니다. 방화벽(9876 포트)을 확인하세요.');
      } else {
        setConnectionMsg(`Connection Failed: ${e.message}`);
      }
    } finally {
      setTestLoading(false);
    }
  }, [useRealApi]);

  // Auto-connect on mount
  useEffect(() => {
    if (useRealApi) {
      handleTestConnection();
    }
  }, []);

  const handleSimulate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setConnectionStatus('idle');

    try {
      const sql = await generateSqlFromNaturalLanguage(input);

      if (useRealApi) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sql }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || errData.details || `Server responded with ${response.status}`);
          }

          const json = await response.json();
          setResult({
            sql,
            data: json.data || [],
          });
        } catch (apiErr: any) {
           let errMsg = apiErr.message;
           if (apiErr.name === 'AbortError') {
             errMsg = 'Request Timed Out (15s). Check network/firewall.';
           }
           setResult({
            sql,
            data: [],
            error: `API Error: ${errMsg}`
          });
        }
      } else {
        // Mock mode
        await new Promise(resolve => setTimeout(resolve, 800));
        let filteredData = [...MOCK_USERS];
        setResult({ sql, data: filteredData });
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
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-white">AI SQL Query Simulator</h3>
                {/* Version Badge - Red for high visibility to confirm deployment update */}
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/40 animate-pulse">
                    v3.0 (Updated)
                </span>
              </div>
              <p className="text-slate-400 mt-1 text-sm">
                자연어를 SQL로 변환하여 실행합니다. (Winpos3 접속)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {useRealApi && (
              <button
                onClick={handleTestConnection}
                disabled={testLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium whitespace-nowrap"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {testLoading ? '접속 중...' : '재연결 테스트'}
              </button>
            )}

            <button
              onClick={() => {
                  setUseRealApi(!useRealApi);
                  setResult(null);
                  setConnectionStatus('idle');
              }}
              className={`flex items-center justify-center gap-3 px-4 py-2 rounded-lg border transition-all duration-300 text-sm font-medium ${
                useRealApi 
                  ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/20' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {useRealApi ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {useRealApi ? '실제 서버 (Real API)' : '가상 데이터 (Mock)'}
            </button>
          </div>
        </div>

        {/* Connection Status Big Banner */}
        {useRealApi && connectionStatus === 'success' && (
            <div className="mb-6 bg-green-900/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-4 animate-fade-in">
                <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                    <Server className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-green-300 font-bold text-lg flex items-center gap-2">
                        Connected to: <span className="text-white underline underline-offset-4">{connectedDbName}</span>
                    </h4>
                    <p className="text-green-400/70 text-xs font-mono mt-1">{connectionMsg}</p>
                </div>
            </div>
        )}

        {useRealApi && connectionStatus === 'error' && (
             <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-4 animate-fade-in">
                <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                    <h4 className="text-red-300 font-bold">연결 실패</h4>
                    <p className="text-red-200/70 text-sm mt-1 whitespace-pre-wrap">{connectionMsg}</p>
                    <div className="mt-2 text-xs text-red-400/60">
                        * Vercel 환경변수(DB_NAME, DB_PORT)와 방화벽 설정을 확인해주세요.
                    </div>
                </div>
            </div>
        )}
        
        {useRealApi && connectionStatus === 'idle' && !testLoading && (
            <div className="mb-6 text-center py-4 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
                대기 중... (자동 연결 시도됨)
            </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
            placeholder={useRealApi ? `[${connectedDbName || 'DB'}]에 쿼리 요청 (예: 모든 테이블 보여줘)` : "예: '관리자(Admin) 권한을 가진 사용자 보여줘'"}
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
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
              <Code className="w-4 h-4 text-green-400" />
              <span className="text-sm font-mono text-slate-300">Generated T-SQL</span>
            </div>
            <div className="p-4 font-mono text-sm text-green-300 overflow-auto flex-1 whitespace-pre-wrap">
              {result.sql}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-mono text-slate-300">
                {result.error ? 'Error' : `Result Data (${result.data.length} rows)`}
              </span>
            </div>
            <div className="p-0 overflow-auto flex-1 min-h-[200px] max-h-[500px]">
              {result.error ? (
                <div className="p-6 text-red-400 text-sm font-mono whitespace-pre-wrap">
                  {result.error}
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-200 uppercase font-medium sticky top-0">
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
                          <td key={vIdx} className="px-4 py-3 max-w-xs truncate border-r border-slate-800/50 last:border-0">
                             {val === null ? <span className="text-slate-600 italic">NULL</span> : (typeof val === 'object' ? JSON.stringify(val) : val?.toString())}
                          </td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
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