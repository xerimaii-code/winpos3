
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Database, Loader2, Code, Wifi, WifiOff, Activity, CheckCircle2, XCircle, Server, BrainCircuit, ScanBarcode, X, Play, Settings, ChevronDown, ChevronUp, Zap, AlertTriangle } from 'lucide-react';
import { MOCK_USERS, INITIAL_KNOWLEDGE } from '../constants';
import { generateSqlFromNaturalLanguage } from '../services/geminiService';
import { QueryResult } from '../types';
import { SettingsModal } from './SettingsModal';
import { getKnowledge, saveKnowledge } from '../utils/db';

export const SqlSimulator: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [useRealApi, setUseRealApi] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMsg, setConnectionMsg] = useState('');
  const [connectedDbName, setConnectedDbName] = useState<string>('');
  const [backendVersion, setBackendVersion] = useState<string>('Checking...');
  const [dbSchema, setDbSchema] = useState<string>(''); 
  
  // 설정 모달 관련
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customKnowledge, setCustomKnowledge] = useState<string>('');

  // 결과창 접기/펴기 (SQL 영역)
  const [showSql, setShowSql] = useState(false);

  // 초기 로드: Local DB에서 학습 내용 가져오기 (없으면 하드코딩된 내용으로 초기화)
  const loadKnowledge = useCallback(async () => {
    let knowledge = await getKnowledge();
    if (knowledge === null) {
      console.log("No local knowledge found, seeding with initial knowledge.");
      knowledge = INITIAL_KNOWLEDGE;
      await saveKnowledge(knowledge);
    }
    setCustomKnowledge(knowledge);
  }, []);

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);


  const handleTestConnection = useCallback(async () => {
    if (!useRealApi) return;

    setTestLoading(true);
    setConnectionStatus('idle');
    setResult(null);
    setConnectedDbName('');
    setBackendVersion('Checking...');
    setDbSchema('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
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
      
      if (json.apiVersion) {
        setBackendVersion(json.apiVersion);
      } else {
        setBackendVersion('Unknown (Old Version)');
      }

      if (json.data && json.data.length > 0) {
        setConnectionStatus('success');
        
        const dbName = json.data[0].current_db || 'Unknown';
        const serverVersion = json.data[0].version.split('\n')[0].substring(0, 30);
        
        setConnectedDbName(dbName);
        setConnectionMsg(`Server: ${serverVersion}...`);
        
        const schemaQuery = `
            SELECT 
                t.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                CASE WHEN k.CONSTRAINT_TYPE = 'PRIMARY KEY' THEN 'YES' ELSE 'NO' END as IS_PRIMARY_KEY
            FROM INFORMATION_SCHEMA.TABLES t
            JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
            LEFT JOIN (
                SELECT kcu.TABLE_NAME, kcu.COLUMN_NAME, tc.CONSTRAINT_TYPE
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
                ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ) k ON c.TABLE_NAME = k.TABLE_NAME AND c.COLUMN_NAME = k.COLUMN_NAME
            WHERE t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
        `;
        
        const schemaResponse = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: schemaQuery }),
        });

        if (schemaResponse.ok) {
            const schemaJson = await schemaResponse.json();
            const rows = schemaJson.data;
            
            const schemaMap: Record<string, string[]> = {};
            rows.forEach((row: any) => {
                if (!schemaMap[row.TABLE_NAME]) {
                    schemaMap[row.TABLE_NAME] = [];
                }
                const typeInfo = row.CHARACTER_MAXIMUM_LENGTH ? `${row.DATA_TYPE}(${row.CHARACTER_MAXIMUM_LENGTH})` : row.DATA_TYPE;
                const pkInfo = row.IS_PRIMARY_KEY === 'YES' ? ' [PK]' : '';
                schemaMap[row.TABLE_NAME].push(`${row.COLUMN_NAME} (${typeInfo})${pkInfo}`);
            });

            let learnedSchema = "";
            Object.entries(schemaMap).forEach(([table, columns]) => {
                learnedSchema += `Table '${table}': ${columns.join(', ')}\n`;
            });
            
            setDbSchema(learnedSchema);
            setResult(null);
        } else {
            setResult(null);
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

  useEffect(() => {
    if (useRealApi) {
      handleTestConnection();
    }
  }, []);

  const handleSimulate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const sql = await generateSqlFromNaturalLanguage(input, dbSchema, customKnowledge);

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
          if (json.apiVersion) setBackendVersion(json.apiVersion);

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

  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  const handleBarcodeScan = async () => {
    alert(`바코드 스캔 활성화 (데모: 상품코드 입력)`);
    setInput("상품코드 880123456789 조회");
  };

  const getStatusIndicator = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 text-blue-700 rounded-full animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-bold">RUNNING...</span>
        </div>
      );
    }
    if (connectionStatus === 'success') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-xs font-bold">ONLINE ({connectedDbName})</span>
        </div>
      );
    }
    if (connectionStatus === 'error') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-200 text-red-700 rounded-full">
          <XCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">OFFLINE</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 rounded-full">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs font-bold">CONNECTING...</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        initialKnowledge={customKnowledge}
        onKnowledgeSaved={loadKnowledge}
        dbSchema={dbSchema}
      />

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 sticky top-16 z-30">
        <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
                 {getStatusIndicator()}
            </div>
            <div className="flex items-center gap-2">
                {useRealApi && (
                <button
                    onClick={handleTestConnection}
                    disabled={testLoading || loading}
                    className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="서버 재연결"
                >
                    {testLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Activity className="w-5 h-5" />}
                </button>
                )}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                    title="설정"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
              placeholder="상품명, 바코드 또는 질문..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 font-medium"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            {input && (
              <button 
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
             <button
                onClick={handleSimulate}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {loading ? '실행 중...' : '실행'}
            </button>
            <button
                onClick={handleBarcodeScan}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
                <ScanBarcode className="w-5 h-5" />
                SCAN
            </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[200px]">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">
                    조회 결과 <span className="text-slate-400 font-normal">({result.data.length}건)</span>
                  </span>
              </div>
            </div>
            
            <div className="p-0 flex-1 bg-slate-50/30">
              {result.error ? (
                <div className="p-6 text-red-600 text-sm font-mono whitespace-pre-wrap bg-red-50 h-full flex items-center justify-center text-center">
                   <div className="flex flex-col items-center">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                        <span>{result.error}</span>
                   </div>
                </div>
              ) : (
                <>
                    <div className="block md:hidden p-3 space-y-3">
                        {result.data.length > 0 ? result.data.map((row, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
                                {Object.entries(row).map(([key, val], vIdx) => (
                                    <div key={vIdx} className="flex justify-between items-start border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide w-1/3 truncate">{key}</span>
                                        <span className="text-sm font-medium text-slate-800 text-right w-2/3 break-words">
                                            {val === null ? <span className="text-slate-300">NULL</span> : (typeof val === 'object' ? JSON.stringify(val) : val?.toString())}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )) : (
                             <div className="py-8 text-center text-slate-400 text-sm">데이터가 없습니다.</div>
                        )}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0">
                            <tr>
                            {result.data.length > 0 ? Object.keys(result.data[0]).map(key => (
                                <th key={key} className="px-4 py-3 whitespace-nowrap border-b border-slate-200 bg-slate-100">{key}</th>
                            )) : <th className="px-4 py-3 border-b border-slate-200">Result</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {result.data.length > 0 ? result.data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                {Object.values(row).map((val, vIdx) => (
                                <td key={vIdx} className="px-4 py-3 max-w-xs truncate border-r border-slate-100 last:border-0">
                                    {val === null ? <span className="text-slate-300 italic">NULL</span> : (typeof val === 'object' ? JSON.stringify(val) : val?.toString())}
                                </td>
                                ))}
                            </tr>
                            )) : (
                            <tr>
                                <td colSpan={100} className="px-4 py-12 text-center text-slate-400">데이터가 없습니다.</td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button 
                onClick={() => setShowSql(!showSql)}
                className="w-full bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
               <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Generated Query</span>
               </div>
               {showSql ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            
            {showSql && (
                <div className="p-4 font-mono text-xs text-slate-600 bg-slate-50/50 border-t border-slate-100 overflow-x-auto whitespace-pre-wrap">
                {result.sql}
                </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
