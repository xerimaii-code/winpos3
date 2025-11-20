
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Database, Loader2, Code, Wifi, WifiOff, Activity, CheckCircle2, XCircle, Server, BrainCircuit, ScanBarcode, X, BookOpen } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { generateSqlFromNaturalLanguage } from '../services/geminiService';
import { QueryResult } from '../types';
import { LearningModal } from './LearningModal';
import { getKnowledge } from '../utils/db';

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
  
  // 심화 학습 관련 상태
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [customKnowledge, setCustomKnowledge] = useState<string>('');

  // 초기 로드 시 IndexedDB에서 학습 내용 가져오기
  useEffect(() => {
    getKnowledge().then(saved => {
      if (saved) setCustomKnowledge(saved);
    });
  }, []);

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
            SELECT t.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE
            FROM INFORMATION_SCHEMA.TABLES t
            JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
            WHERE t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
        `;
        
        const schemaResponse = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: schemaQuery }),
            signal: controller.signal
        });

        if (schemaResponse.ok) {
            const schemaJson = await schemaResponse.json();
            const rows = schemaJson.data;
            
            const schemaMap: Record<string, string[]> = {};
            rows.forEach((row: any) => {
                if (!schemaMap[row.TABLE_NAME]) {
                    schemaMap[row.TABLE_NAME] = [];
                }
                schemaMap[row.TABLE_NAME].push(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
            });

            let learnedSchema = "";
            Object.entries(schemaMap).forEach(([table, columns]) => {
                learnedSchema += `Table '${table}': ${columns.join(', ')}\n`;
            });
            
            setDbSchema(learnedSchema);
            
            const simplifiedData = Object.keys(schemaMap).map(tableName => ({ TABLE_NAME: tableName, COLUMNS_COUNT: schemaMap[tableName].length }));
            setResult({
                sql: "-- AI has learned the database structure successfully.",
                data: simplifiedData
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
      // DB 스키마 + 사용자가 입력한 심화 학습 내용(customKnowledge)을 함께 전달
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

  const handleBarcodeScan = () => {
    alert("바코드 스캐너가 활성화되었습니다. (데모)");
    setInput("상품코드 880123456789 조회");
    setTimeout(() => handleSimulate(), 500);
  };

  return (
    <div className="space-y-6">
      <LearningModal 
        isOpen={isLearningModalOpen} 
        onClose={() => setIsLearningModalOpen(false)}
        onUpdate={(knowledge) => setCustomKnowledge(knowledge)}
      />

      {/* Controls & Info Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800">Winpos3 Query</h3>
                {customKnowledge && (
                   <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                     심화학습 적용됨
                   </span>
                )}
              </div>
              <p className="text-slate-500 mt-1 text-sm">
                자연어로 조회하거나 바코드를 스캔하세요.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Deep Learning Button */}
            <button
              onClick={() => setIsLearningModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all text-sm font-bold shadow-sm"
            >
               <BookOpen className="w-4 h-4" />
               심화 학습
            </button>

            {useRealApi && (
              <button
                onClick={handleTestConnection}
                disabled={testLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-sm font-medium whitespace-nowrap"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                {testLoading ? '연결 중...' : '서버 재연결'}
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
                  ? 'bg-green-600 text-white border-green-500 shadow-md hover:bg-green-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {useRealApi ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {useRealApi ? '실제 서버' : '연습 모드'}
            </button>
          </div>
        </div>

        {/* Connection Status Banner */}
        {useRealApi && connectionStatus === 'success' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4 animate-fade-in">
                <div className="p-3 bg-white rounded-full text-blue-500 border border-blue-100 shadow-sm self-start md:self-center">
                    <Server className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="text-blue-900 font-bold text-lg flex items-center gap-2">
                        Connected to: <span className="underline underline-offset-4">{connectedDbName}</span>
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                        <span className="text-blue-700 text-xs font-mono">{connectionMsg}</span>
                        {dbSchema && (
                             <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> 스키마 학습 완료
                             </span>
                        )}
                    </div>
                </div>
                <div className="bg-white px-3 py-2 rounded border border-slate-200 text-right shadow-sm">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">API Version</div>
                    <div className={`text-sm font-mono font-bold ${backendVersion.includes('v8.0') ? 'text-blue-600' : 'text-red-500'}`}>
                        {backendVersion}
                    </div>
                </div>
            </div>
        )}

        {useRealApi && connectionStatus === 'error' && (
             <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-4 animate-fade-in">
                <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                    <h4 className="text-red-800 font-bold">연결 실패</h4>
                    <p className="text-red-600 text-sm mt-1 whitespace-pre-wrap">{connectionMsg}</p>
                </div>
            </div>
        )}

        {/* Search Input Area */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
              placeholder={useRealApi ? "상품명, 바코드 또는 질문을 입력하세요..." : "예: '매출 상위 10개 보여줘'"}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 shadow-inner font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            
            {input && (
              <button 
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Barcode Scan Button */}
          <button
            onClick={handleBarcodeScan}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-slate-500/20 active:scale-95"
            title="바코드 스캔"
          >
            <ScanBarcode className="w-6 h-6" />
            <span className="hidden sm:inline">SCAN</span>
          </button>
        </div>
      </div>

      {/* Results Area */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* SQL Query View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-mono text-slate-600 font-bold">Generated SQL</span>
            </div>
            <div className="p-4 font-mono text-sm text-slate-700 overflow-auto flex-1 whitespace-pre-wrap bg-slate-50/50">
              {result.sql}
            </div>
          </div>

          {/* Data Table View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-mono text-slate-600 font-bold">
                {result.error ? 'Error' : `Result Data (${result.data.length} rows)`}
              </span>
            </div>
            <div className="p-0 overflow-auto flex-1 min-h-[300px] max-h-[600px]">
              {result.error ? (
                <div className="p-6 text-red-600 text-sm font-mono whitespace-pre-wrap bg-red-50 h-full">
                  {result.error}
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 shadow-sm">
                    <tr>
                      {result.data.length > 0 ? Object.keys(result.data[0]).map(key => (
                        <th key={key} className="px-4 py-3 whitespace-nowrap border-b border-slate-200 bg-slate-100">{key}</th>
                      )) : (
                        <th className="px-4 py-3 border-b border-slate-200">Result</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.data.length > 0 ? result.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="px-4 py-3 max-w-xs truncate border-r border-slate-100 last:border-0">
                             {val === null ? <span className="text-slate-400 italic">NULL</span> : (typeof val === 'object' ? JSON.stringify(val) : val?.toString())}
                          </td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
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
