
import React, { useState, useEffect } from 'react';
import { X, Save, BrainCircuit, Database, Loader2, AlertCircle, CheckCircle, Github, RefreshCw } from 'lucide-react';
import { saveKnowledge, saveGitUrl, getGitUrl } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKnowledge: string;
  onKnowledgeSaved: () => void;
  dbSchema: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialKnowledge, onKnowledgeSaved, dbSchema }) => {
  const [activeTab, setActiveTab] = useState<'learning' | 'schema'>('learning');
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const [gitUrl, setGitUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
        setKnowledge(initialKnowledge);
        setStatusMessage(null); // Reset status on open
        getGitUrl().then(url => setGitUrl(url || ''));
    }
  }, [isOpen, initialKnowledge]);

  const showStatus = (type: 'success' | 'error', text: string, duration = 5000) => {
      setStatusMessage({ type, text });
      setTimeout(() => setStatusMessage(null), duration);
  };
  
  const toRawUrl = (url: string): string | null => {
      if (!url || !url.includes('github.com')) return null;
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'raw.githubusercontent.com') return url;
        
        urlObj.hostname = 'raw.githubusercontent.com';
        const path = urlObj.pathname.replace('/blob/', '/');
        // '/refs/heads/' 가 포함된 잘못된 경로 수정
        urlObj.pathname = path.replace('/refs/heads/', '/');
        return urlObj.toString();
      } catch {
        return null;
      }
  };

  const handleSaveToBrowser = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await saveKnowledge(knowledge); // Save knowledge content
      await saveGitUrl(gitUrl);     // Save Git URL setting
      onKnowledgeSaved();
      showStatus('success', "학습 내용과 Git URL 설정이 브라우저에 저장되었습니다.");
    } catch (e: any) {
      console.error("Failed to save knowledge", e);
      showStatus('error', `저장 실패: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLoadFromGit = async () => {
    setIsFetching(true);
    setStatusMessage(null);
    try {
      const rawUrl = toRawUrl(gitUrl);
      if (!rawUrl) {
        throw new Error("유효한 GitHub URL이 아닙니다. github.com 또는 raw.githubusercontent.com URL을 사용해주세요.");
      }
      
      const response = await fetch(rawUrl, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }
      const text = await response.text();
      setKnowledge(text);
      // Fetched content is now in the editor, user can save it to browser if they wish.
      showStatus('success', "Git에서 최신 내용을 성공적으로 불러왔습니다. '브라우저에 저장'을 눌러야 적용됩니다.");
    } catch (e: any) {
      console.error("Failed to load from Git", e);
      showStatus('error', `불러오기 실패: ${e.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  if (!isOpen) return null;
  
  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveTab(id as any)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${activeTab === id ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
      {icon} {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3"><div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><BrainCircuit className="w-6 h-6" /></div><div><h2 className="text-xl font-bold text-slate-800">AI 심화 학습 및 설정</h2><p className="text-slate-500 text-sm">AI의 지식 베이스를 관리하고 DB 구조를 확인합니다.</p></div></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex rounded-t-lg overflow-hidden p-1 bg-slate-100 m-6 mb-0">
          <TabButton id="learning" label="심화 학습" icon={<BrainCircuit className="w-4 h-4" />} />
          <TabButton id="schema" label="DB 스키마" icon={<Database className="w-4 h-4" />} />
        </div>
        <div className="flex-1 p-6 pt-4 overflow-y-auto bg-slate-50">
          {activeTab === 'learning' && (
            <div className="animate-fade-in-fast space-y-6">
              <div className="border-b border-slate-200 pb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-2">1. Git 동기화 (읽기 전용)</h4>
                <p className="text-xs text-slate-500 mb-3">학습 내용의 '원본(Source of Truth)'은 GitHub에 있습니다. 수정은 GitHub에서 직접하고, 여기서는 최신 정보를 불러오기만 하세요.</p>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={gitUrl} onChange={(e) => setGitUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/..." className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                 <div className="mt-3">
                    <button onClick={handleLoadFromGit} disabled={isSaving || isFetching || !gitUrl.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm border border-slate-300 transition-all active:scale-95 disabled:opacity-50">
                        {isFetching ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {isFetching ? '불러오는 중...' : "Git에서 최신 정보 불러오기"}
                    </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">2. 사용자 정의 지식 편집</h4>
                <p className="text-xs text-slate-500 mb-3">Git에서 불러온 내용을 확인하고, 로컬 테스트를 위해 임시 수정할 수 있습니다. 변경 내용은 브라우저에만 저장됩니다.</p>
                <textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)} placeholder="예: '취소된 주문은 sale_status가 9번입니다.'" className="w-full h-40 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none text-sm leading-relaxed shadow-inner" />
                <button onClick={handleSaveToBrowser} disabled={isSaving || isFetching} className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-sm shadow-lg shadow-slate-500/30 transition-all active:scale-95 disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? '저장 중...' : "브라우저에 저장"}
                </button>
              </div>

              {statusMessage && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm ${ statusMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800' }`}>
                      {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                      <span className="break-all">{statusMessage.text}</span>
                  </div>
              )}
            </div>
          )}
          {activeTab === 'schema' && (
            <div className="animate-fade-in-fast">
              <h4 className="text-sm font-bold text-slate-700 mb-2">자동 학습된 DB 스키마 (읽기 전용)</h4>
              <p className="text-xs text-slate-500 mb-3">앱이 DB에 연결될 때마다 자동으로 분석된 테이블 구조입니다. AI는 이 정보를 기반으로 쿼리를 생성합니다.</p>
              <textarea value={dbSchema || "DB에 연결되지 않았거나 스키마를 불러올 수 없습니다."} readOnly className="w-full h-72 p-4 bg-slate-100 border border-slate-300 rounded-xl focus:outline-none resize-none text-xs font-mono text-slate-600 leading-relaxed shadow-inner" />
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl"><button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-all">닫기</button></div>
      </div>
    </div>
  );
};
