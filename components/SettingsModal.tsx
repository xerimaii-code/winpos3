
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, BrainCircuit, Database, Loader2, AlertCircle, CheckCircle, HardDrive, FileJson, Upload, Camera, RefreshCw } from 'lucide-react';
import { saveKnowledge, saveDbSchema, exportData, importData } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKnowledge: string;
  onDataSaved: () => void;
  dbSchema: string;
  setDbSchema: (schema: string) => void;
}

interface VideoDevice {
    id: string;
    label: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialKnowledge, onDataSaved, dbSchema, setDbSchema }) => {
  const [activeTab, setActiveTab] = useState<'learning' | 'data' | 'camera'>('learning');
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const [localDbSchema, setLocalDbSchema] = useState(dbSchema);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera States
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setKnowledge(initialKnowledge);
        setLocalDbSchema(dbSchema);
        setStatusMessage(null);
        if (activeTab === 'camera') {
            loadCameras();
        }
    }
  }, [isOpen, initialKnowledge, dbSchema, activeTab]);

  const loadCameras = async () => {
      setCameraLoading(true);
      try {
        const savedId = localStorage.getItem('winpos3_preferred_camera');
        if (savedId) setSelectedCameraId(savedId);

        if (window.Html5Qrcode) {
            const cameras = await window.Html5Qrcode.getCameras();
            if (cameras && cameras.length) {
                const formatted = cameras.map((c: any) => ({ id: c.id, label: c.label || `Camera ${c.id.slice(0,5)}` }));
                setDevices(formatted);
                if (!savedId && formatted.length > 0) {
                    setSelectedCameraId(formatted[0].id);
                }
            }
        }
      } catch (e) {
          console.error("Camera Load Error", e);
          // Don't show error toast here, just UI
      } finally {
          setCameraLoading(false);
      }
  };

  const handleCameraSave = () => {
      if (selectedCameraId) {
          localStorage.setItem('winpos3_preferred_camera', selectedCameraId);
          showStatus('success', '기본 카메라 설정이 저장되었습니다.');
      }
  };

  const showStatus = (type: 'success' | 'error', text: string, duration = 3000) => {
      setStatusMessage({ type, text });
      setTimeout(() => setStatusMessage(null), duration);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await saveKnowledge(knowledge);
      await saveDbSchema(localDbSchema);
      setDbSchema(localDbSchema); 

      showStatus('success', "모든 설정이 브라우저(IndexedDB)에 저장되었습니다.");
      
      setTimeout(() => {
          onDataSaved();
      }, 500);
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
        showStatus('success', '데이터 백업 파일이 다운로드되었습니다.');
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
            if (typeof text !== 'string') throw new Error("파일을 읽을 수 없습니다.");
            
            const data = JSON.parse(text);
            await importData(data);
            
            showStatus('success', '데이터가 성공적으로 복원되었습니다. 잠시 후 갱신됩니다.');
            
            setTimeout(() => {
                onDataSaved(); 
                onClose();
            }, 1500);
        } catch (error: any) {
            showStatus('error', `복원 실패: 데이터 형식이 올바르지 않습니다. (${error.message})`);
        }
    };
    reader.onerror = () => {
        showStatus('error', '파일 읽기 중 오류가 발생했습니다.');
    };
    reader.readAsText(file);
    if(event.target) event.target.value = ''; 
  };

  if (!isOpen) return null;
  
  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveTab(id as any)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${activeTab === id ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
      {icon} {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  {activeTab === 'learning' ? <BrainCircuit className="w-6 h-6" /> : activeTab === 'data' ? <HardDrive className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              </div>
              <div>
                  <h2 className="text-xl font-bold text-slate-800">설정 및 데이터</h2>
                  <p className="text-slate-500 text-sm">AI 지식, 데이터 관리 및 하드웨어 설정</p>
              </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex border-b border-slate-200">
          <TabButton id="learning" label="AI 학습" icon={<BrainCircuit className="w-4 h-4" />} />
          <TabButton id="data" label="데이터 관리" icon={<Database className="w-4 h-4" />} />
          <TabButton id="camera" label="카메라 설정" icon={<Camera className="w-4 h-4" />} />
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {activeTab === 'learning' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-rose-500"/> 심화 학습 (Business Knowledge)
                    </h4>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Editable</span>
                </div>
                <p className="text-xs text-slate-500">
                    AI가 쿼리를 생성할 때 반드시 따라야 할 업무 규칙을 자연어로 입력하세요.
                </p>
                <textarea 
                    value={knowledge} 
                    onChange={(e) => setKnowledge(e.target.value)} 
                    placeholder="예: '취소된 주문(sale_status=9)은 매출 집계에서 제외해줘.'" 
                    className="w-full h-40 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-y text-sm leading-relaxed shadow-sm font-medium text-slate-700" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-500"/> DB 스키마 (Schema Structure)
                    </h4>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Auto-Learned</span>
                </div>
                <p className="text-xs text-slate-500">
                    앱 시작 시 자동으로 학습된 DB 구조입니다. 필요 시 수정하여 저장할 수 있습니다.
                </p>
                <textarea 
                    value={localDbSchema} 
                    onChange={(e) => setLocalDbSchema(e.target.value)} 
                    className="w-full h-40 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-xs font-mono text-slate-600 leading-relaxed shadow-sm" 
                />
              </div>

              <button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-70">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? '저장 중...' : "브라우저에 저장 (Save to Browser)"}
              </button>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
                   <h4 className="text-base font-bold text-blue-800 mb-2">데이터 백업 및 복원</h4>
                   <p className="text-sm text-blue-600 mb-4">
                       현재 설정된 <b>심화 학습 내용</b>, <b>DB 스키마</b>, 그리고 <b>저장된 쿼리 히스토리</b>를 <br/>
                       하나의 파일로 안전하게 보관하거나 복원할 수 있습니다.
                   </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={handleBackup} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-slate-200 hover:border-rose-400 hover:bg-rose-50 rounded-xl transition-all group">
                      <div className="p-3 bg-slate-100 group-hover:bg-white rounded-full transition-colors">
                        <FileJson className="w-8 h-8 text-slate-600 group-hover:text-rose-500" />
                      </div>
                      <div className="text-center">
                          <span className="block font-bold text-slate-800 group-hover:text-rose-700">데이터 백업</span>
                          <span className="text-xs text-slate-400">.json 파일로 다운로드</span>
                      </div>
                  </button>

                  <button onClick={handleRestoreClick} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl transition-all group">
                      <div className="p-3 bg-slate-100 group-hover:bg-white rounded-full transition-colors">
                        <Upload className="w-8 h-8 text-slate-600 group-hover:text-emerald-500" />
                      </div>
                      <div className="text-center">
                          <span className="block font-bold text-slate-800 group-hover:text-emerald-700">데이터 복원</span>
                          <span className="text-xs text-slate-400">.json 파일 업로드</span>
                      </div>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
               </div>
            </div>
          )}

          {activeTab === 'camera' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-100 rounded-xl p-5">
                      <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Camera className="w-5 h-5 text-slate-600" /> 기본 카메라 설정
                      </h4>
                      <div className="space-y-4">
                          {cameraLoading ? (
                              <div className="text-center py-4 text-slate-500 flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" /> 카메라 불러오는 중...
                              </div>
                          ) : devices.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                  <label className="text-sm font-medium text-slate-600">사용할 카메라 선택</label>
                                  <select 
                                      value={selectedCameraId} 
                                      onChange={(e) => setSelectedCameraId(e.target.value)}
                                      className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                  >
                                      {devices.map(d => (
                                          <option key={d.id} value={d.id}>{d.label}</option>
                                      ))}
                                  </select>
                                  <p className="text-xs text-slate-500 mt-1">
                                      * 선택한 카메라는 바코드 스캔 시 기본으로 사용됩니다.
                                  </p>
                              </div>
                          ) : (
                              <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg text-sm">
                                  사용 가능한 카메라를 찾을 수 없거나 권한이 없습니다.
                              </div>
                          )}

                          <div className="flex justify-end pt-4">
                             <button 
                                onClick={loadCameras}
                                className="mr-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-bold flex items-center gap-2"
                             >
                                <RefreshCw className="w-4 h-4" /> 새로고침
                             </button>
                             <button 
                                onClick={handleCameraSave}
                                disabled={!selectedCameraId}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-bold shadow-md disabled:opacity-50 flex items-center gap-2"
                             >
                                <CheckCircle className="w-4 h-4" /> 설정 저장
                             </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
        </div>

        {statusMessage && (
            <div className={`mx-6 mb-2 p-3 rounded-lg flex items-center gap-3 text-sm font-medium animate-bounce-in ${ 
                statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200' 
            }`}>
                {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{statusMessage.text}</span>
            </div>
        )}

        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
            <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
                닫기
            </button>
        </div>
      </div>
    </div>
  );
};
