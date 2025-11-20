
import React, { useState, useEffect } from 'react';
import { X, Save, BrainCircuit, Database } from 'lucide-react';
import { saveKnowledge } from '../utils/db';

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
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
        setKnowledge(initialKnowledge);
    }
  }, [isOpen, initialKnowledge]);

  const handleSaveKnowledge = async () => {
    setIsSaving(true);
    try {
      await saveKnowledge(knowledge);
      onKnowledgeSaved();
      alert("학습 내용이 브라우저에 저장되었습니다.");
    } catch (e) {
      console.error("Failed to save knowledge", e);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
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
            <div className="animate-fade-in-fast">
              <h4 className="text-sm font-bold text-slate-700 mb-2">사용자 정의 지식</h4>
              <p className="text-xs text-slate-500 mb-3">DB 스키마 외에 AI에게 알려주고 싶은 업무 규칙, 데이터 코드의 의미 등을 자유롭게 작성해주세요.</p>
              <textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)} placeholder="예: '취소된 주문은 sale_status가 9번입니다.'" className="w-full h-64 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none text-sm leading-relaxed shadow-inner" />
              <button onClick={handleSaveKnowledge} disabled={isSaving} className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50"><Save className="w-4 h-4" />{isSaving ? "저장 중..." : "브라우저에 저장"}</button>
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
