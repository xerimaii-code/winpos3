
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, BrainCircuit, Database, Loader2, AlertCircle, CheckCircle, HardDrive } from 'lucide-react';
import { saveKnowledge, saveDbSchema, exportData, importData } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKnowledge: string;
  onDataSaved: () => void;
  dbSchema: string;
  setDbSchema: (schema: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialKnowledge, onDataSaved, dbSchema, setDbSchema }) => {
  const [activeTab, setActiveTab] = useState<'learning' | 'data'>('learning');
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const [localDbSchema, setLocalDbSchema] = useState(dbSchema);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setKnowledge(initialKnowledge);
        setLocalDbSchema(dbSchema);
        setStatusMessage(null); // Reset status on open
    }
  }, [isOpen, initialKnowledge, dbSchema]);

  const showStatus = (type: 'success' | 'error', text: string, duration = 5000) => {
      setStatusMessage({ type, text });
      setTimeout(() => setStatusMessage(null), duration);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await saveKnowledge(knowledge);
      await saveDbSchema(localDbSchema);
      setDbSchema(localDbSchema); // Update parent state immediately
      showStatus('success', "학습 내용과 DB 스키마가 브라우저에 저장되었습니다.");
    } catch (e: any) {
      console.error("Failed to save data", e);
      showStatus('error', `저장 실패: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBackup = async () => {
    try {
        const data = await exportData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `winpos3_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus('success', '데이터가 성공적으로 백업되었습니다.');
    } catch (e: any) {
        showStatus('error', `백업 실패: ${e.message}`);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File could not be read.");
            const data = JSON.parse(text);
            await importData(data);
            showStatus('success', '데이터 복원 완료. 앱을 다시 시작합니다.');
            setTimeout(() => {
                onDataSaved(); // Reload parent state
                onClose();
            }, 2000);
        } catch (error: any) {
            showStatus('error', `복원 실패: ${error.message}`);
        }
    };
    reader.onerror = () => {
        showStatus('error', '파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file);
    // Reset file input so the same file can be selected again
    if(event.target) event.target.value = '';
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
          <div className="flex items-center gap-3"><div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><BrainCircuit className="w-6 h-6" /></div><div><h2 className="text-xl font-bold text-slate-800">AI 설정 및 데이터 관리</h2><p className="text-slate-500 text-sm">AI의 지식과 DB 스키마를 관리하고 데이터를 백업/복원합니다.</p></div></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex rounded-t-lg overflow-hidden p-1 bg-slate-100 m-6 mb-0">
          <TabButton id="learning" label="AI 학습" icon={<BrainCircuit className="w-4 h-4" />} />
          <TabButton id="data" label="데이터 관리" icon={<HardDrive className="w-4 h-4" />} />
        </div>
        <div className="flex-1 p-6 pt-4 overflow-y-auto bg-slate-50">
          {activeTab === 'learning' && (
            <div className="animate-fade-in-fast space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">심화 학습 내용</h4>
                <p className="text-xs text-slate-500 mb-3">AI가 SQL 생성 시 참고할 비즈니스 규칙이나 특별 지식을 입력합니다.</p>
                <textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)} placeholder="예: '취소된 주문은 sale_status가 9번입니다.'" className="w-full h-32 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-y text-sm leading-relaxed shadow-inner" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">DB 스키마</h4>
                <p className="text-xs text-slate-500 mb-3">앱이 자동으로 학습한 DB 구조입니다. 필요 시 직접 수정할 수 있습니다.</p>
                <textarea value={localDbSchema} onChange={(e) => setLocalDbSchema(e.target.value)} readOnly={false} className="w-full h-40 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-y text-xs font-mono text-slate-600 leading-relaxed shadow-inner" />
              </div>
              <button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-bold text-sm shadow-lg shadow-slate-500/30 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? '저장 중...' : "브라우저에 저장"}
              </button>
            </div>
          )}
          {activeTab === 'data' && (
            <div className="animate-fade-in-fast text-center space-y-4 p-4">
               <h4 className="text-base font-bold text-slate-700">데이터 백업 및 복원</h4>
               <p className="text-sm text-slate-500 max-w-md mx-auto">
                 AI 학습 내용, DB 스키마, 쿼리 히스토리를 포함한 모든 데이터를 하나의 파일로 내보내거나, 백업 파일에서 복원할 수 있습니다.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <button onClick={handleBackup} className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-sm border border-blue-200 transition-all active:scale-95">
                      <Database className="w-8 h-8 mb-2" />
                      데이터 백업
                      <span className="font-normal text-xs">(JSON 파일로 내보내기)</span>
                  </button>
                   <button onClick={handleRestoreClick} className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-sm border border-emerald-200 transition-all active:scale-95">
                      <HardDrive className="w-8 h-8 mb-2" />
                      데이터 복원
                      <span className="font-normal text-xs">(백업 파일에서 가져오기)</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
               </div>
            </div>
          )}
        </div>
         {statusMessage && (
            <div className={`mx-6 mb-1 p-3 rounded-lg flex items-center gap-3 text-sm transition-all ${ statusMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800' }`}>
                {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <span className="break-all">{statusMessage.text}</span>
            </div>
        )}
        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl"><button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-all">닫기</button></div>
      </div>
    </div>
  );
};
