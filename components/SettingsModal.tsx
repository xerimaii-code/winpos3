
import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Trash2, Camera, Settings, Database } from 'lucide-react';
import { saveKnowledge, getKnowledge, saveDeviceSetting, getDeviceSetting } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateKnowledge: (knowledge: string) => void;
  currentSchema: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpdateKnowledge, currentSchema }) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'camera' | 'schema'>('knowledge');
  
  // Knowledge State
  const [knowledge, setKnowledge] = useState('');
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  // Camera State
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraLoading, setCameraLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    // Load Knowledge
    const savedKnowledge = await getKnowledge();
    setKnowledge(savedKnowledge);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
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
        <div className="flex border-b border-slate-100 px-6">
            <button 
                onClick={() => setActiveTab('knowledge')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'knowledge' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <BookOpen className="w-4 h-4" />
                심화 학습
            </button>
            <button 
                onClick={() => setActiveTab('camera')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'camera' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Camera className="w-4 h-4" />
                카메라 설정
            </button>
             <button 
                onClick={() => setActiveTab('schema')}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'schema' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Database className="w-4 h-4" />
                DB 스키마 정보
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

            {activeTab === 'camera' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">바코드 스캔 카메라 선택</h3>
                        <div className="space-y-3">
                            {cameras.length > 0 ? cameras.map((camera) => (
                                <label key={camera.deviceId} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                                    <input
                                        type="radio"
                                        name="camera"
                                        value={camera.deviceId}
                                        checked={selectedCameraId === camera.deviceId}
                                        onChange={(e) => setSelectedCameraId(e.target.value)}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-slate-900">{camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`}</div>
                                        <div className="text-xs text-slate-500">ID: {camera.deviceId.slice(0, 10)}...</div>
                                    </div>
                                </label>
                            )) : (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    연결된 카메라를 찾을 수 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveCamera}
                            disabled={cameraLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            카메라 설정 저장
                        </button>
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
