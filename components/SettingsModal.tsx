
import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Trash2, Camera, Settings, Database, Github, Download, Upload, Code2, Globe, Copy, CheckCircle2, FileCode, ListChecks, AlertTriangle } from 'lucide-react';
import { saveKnowledge, getKnowledge, saveDeviceSetting, getDeviceSetting, saveGitUrl, getGitUrl } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateKnowledge: (knowledge: string) => void;
  currentSchema: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpdateKnowledge, currentSchema }) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'camera' | 'schema' | 'git' | 'api'>('knowledge');
  
  // Knowledge State
  const [knowledge, setKnowledge] = useState('');
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  // Camera State
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraLoading, setCameraLoading] = useState(false);

  // Git Sync State
  const [gitUrl, setGitUrl] = useState('');
  const [gitLoading, setGitLoading] = useState(false);

  // API Integration State
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    // Load Knowledge
    const savedKnowledge = await getKnowledge();
    setKnowledge(savedKnowledge);

    // Load Git URL
    const savedGitUrl = await getGitUrl();
    if (savedGitUrl) setGitUrl(savedGitUrl);

    // Load Camera Settings & List
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      const savedCameraId = await getDeviceSetting('selectedCameraId');
      if (savedCameraId) {
        setSelectedCameraId(savedCameraId);
      } else if (videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (e) {
      console.error("Camera info load error", e);
    }
  };

  const handleSaveKnowledge = async () => {
    setKnowledgeLoading(true);
    try {
      await saveKnowledge(knowledge);
      onUpdateKnowledge(knowledge);
      alert("학습 내용이 저장되었습니다.");
    } catch (e) {
      console.error("Failed to save knowledge", e);
      alert("저장에 실패했습니다.");
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const handleClearKnowledge = async () => {
      if(confirm("정말 모든 학습 내용을 삭제하시겠습니까?")) {
          setKnowledge("");
          await saveKnowledge("");
          onUpdateKnowledge("");
      }
  }

  const handleSaveCamera = async () => {
    setCameraLoading(true);
    try {
      await saveDeviceSetting('selectedCameraId', selectedCameraId);
      alert("카메라 설정이 저장되었습니다.");
    } catch (e) {
      alert("설정 저장 실패");
    } finally {
      setCameraLoading(false);
    }
  };

  const handleImportFromGit = async () => {
    if (!gitUrl) return alert("Git Raw URL을 입력해주세요.");
    setGitLoading(true);
    try {
      const res = await fetch(gitUrl);
      if (!res.ok) throw new Error("Failed to fetch");
      const text = await res.text();
      setKnowledge(text);
      await saveGitUrl(gitUrl); // URL 저장
      alert("데이터를 불러왔습니다. '학습 내용 저장' 버튼을 눌러 반영해주세요.");
    } catch (e) {
      alert("불러오기 실패: URL을 확인하거나 CORS 문제를 확인하세요.");
    } finally {
      setGitLoading(false);
    }
  };

  const handleExportToFile = () => {
    const blob = new Blob([knowledge], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `winpos3_knowledge_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchCodeSnippet = `// Winpos3 API 호출 예제
async function fetchWinposData(sqlQuery) {
  const response = await fetch('${window.location.origin}/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'X-Api-Key': 'YOUR_SECRET_KEY' (필요시 백엔드 인증 추가)
    },
    body: JSON.stringify({ query: sqlQuery })
  });

  const result = await response.json();
  return result.data;
}

// 사용 예시
fetchWinposData("SELECT * FROM goods WHERE gname LIKE '%사과%'")
  .then(data => console.log(data));`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-slate-100 rounded-full text-slate-600">
                 <Settings className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-slate-800">설정 (Settings)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('knowledge')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'knowledge' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <BookOpen className="w-4 h-4" />
                심화 학습
            </button>
            <button 
                onClick={() => setActiveTab('git')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'git' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Github className="w-4 h-4" />
                Git 동기화
            </button>
            {/* Camera Tab Removed */}
             <button 
                onClick={() => setActiveTab('api')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'api' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Globe className="w-4 h-4" />
                API & 통합
            </button>
             <button 
                onClick={() => setActiveTab('schema')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'schema' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Database className="w-4 h-4" />
                DB 스키마
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
            {activeTab === 'knowledge' && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-700 mb-2">💡 학습 가이드</h4>
                        <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                        <li>특정 코드값의 의미 (예: sale_status '9'는 반품)</li>
                        <li>테이블 조인 규칙 (예: A테이블 id와 B테이블 user_id는 같다)</li>
                        <li>업무 용어 정의 (예: '객단가' 계산식 등)</li>
                        </ul>
                    </div>
                    <textarea
                        value={knowledge}
                        onChange={(e) => setKnowledge(e.target.value)}
                        placeholder="여기에 DB 구조나 업무 규칙에 대한 설명을 자유롭게 적어주세요..."
                        className="w-full h-64 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                    />
                    <div className="flex justify-between items-center pt-2">
                         <button 
                            onClick={handleClearKnowledge}
                            className="flex items-center gap-1 text-red-500 text-xs hover:text-red-700 px-2 py-1"
                        >
                            <Trash2 className="w-3 h-3" /> 내용 초기화
                        </button>
                        <button
                            onClick={handleSaveKnowledge}
                            disabled={knowledgeLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70"
                        >
                            <Save className="w-4 h-4" />
                            {knowledgeLoading ? '저장 중...' : '학습 내용 저장'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'git' && (
                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> 가져오기 (Import)
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            GitHub의 Raw 파일 URL을 입력하여 학습 내용을 불러옵니다. (예: raw.githubusercontent.com/...)
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={gitUrl}
                                onChange={(e) => setGitUrl(e.target.value)}
                                placeholder="https://raw.githubusercontent.com/user/repo/main/knowledge.txt"
                                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                            <button 
                                onClick={handleImportFromGit}
                                disabled={gitLoading}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-70"
                            >
                                {gitLoading ? '로딩...' : '불러오기'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Download className="w-4 h-4" /> 내보내기 (Export)
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            현재 작성된 학습 내용을 텍스트 파일로 다운로드합니다. 이 파일을 Git에 올리세요.
                        </p>
                        <button 
                            onClick={handleExportToFile}
                            className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <FileCode className="w-4 h-4" />
                            .txt 파일로 다운로드
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'api' && (
                <div className="space-y-8">
                     {/* API Fetch Method */}
                     <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                        <h4 className="text-indigo-900 font-bold text-sm mb-2 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> 방법 1: API 호출 방식 (간편)
                        </h4>
                        <p className="text-xs text-indigo-700 mb-3 leading-relaxed">
                            가장 쉬운 방법입니다. 기존 웹앱에서 이 프로젝트의 URL로 요청을 보냅니다.
                        </p>
                        <div className="relative">
                            <pre className="bg-slate-900 text-blue-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                                {fetchCodeSnippet}
                            </pre>
                            <button 
                                onClick={() => handleCopyCode(fetchCodeSnippet)}
                                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded transition-colors"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Integration Checklist */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="text-slate-800 font-bold text-sm mb-3 flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-green-600" /> 
                            방법 2: 소스 코드 통합 시 필수 체크리스트
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            이 프로젝트의 코드를 기존 웹앱(Vercel 배포)으로 복사해 넣는 경우, 
                            <strong>기존 웹앱의 Vercel 환경변수(Environment Variables)</strong>에도 아래 항목들을 반드시 추가해야 합니다.
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="text-xs font-mono font-bold text-slate-700">API_KEY</span>
                                <span className="text-[10px] text-slate-400">Google Gemini Key</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="text-xs font-mono font-bold text-slate-700">DB_USER</span>
                                <span className="text-[10px] text-slate-400">MS SQL 아이디</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="text-xs font-mono font-bold text-slate-700">DB_PASSWORD</span>
                                <span className="text-[10px] text-slate-400">MS SQL 비밀번호</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="text-xs font-mono font-bold text-slate-700">DB_SERVER</span>
                                <span className="text-[10px] text-slate-400">kjmartII.iptime.org</span>
                            </div>
                             <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="text-xs font-mono font-bold text-slate-700">DB_PORT</span>
                                <span className="text-[10px] text-slate-400">9876</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="text-xs font-mono font-bold text-slate-700">DB_NAME</span>
                                <span className="text-[10px] text-slate-400">winpos3</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>
                                기존 앱에 이미 <code>DB_USER</code> 등의 변수가 있다면, 이름을 <code>WINPOS_DB_USER</code> 등으로 변경하고 코드(api/query.js)도 맞춰서 수정해야 충돌을 피할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'camera' && (
                <div className="space-y-6">
                    {/* Camera UI Removed but logic kept for structure integrity if reverted */}
                     <div className="text-center py-8 text-slate-500 text-sm">
                        카메라 설정 기능은 제외되었습니다. (기본 카메라 사용)
                    </div>
                </div>
            )}

            {activeTab === 'schema' && (
                 <div className="space-y-4 h-full flex flex-col">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h4 className="text-emerald-800 font-bold text-sm mb-1">자동 수집된 스키마</h4>
                        <p className="text-emerald-600 text-xs">DB 연결 시 자동으로 분석한 테이블 구조입니다.</p>
                    </div>
                    <pre className="flex-1 bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-auto whitespace-pre-wrap">
                        {currentSchema || "아직 DB에 연결되지 않았거나 스키마 정보를 가져오지 못했습니다."}
                    </pre>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
