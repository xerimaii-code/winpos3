
import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Github, Upload, RefreshCw, GitBranch, AlertTriangle } from 'lucide-react';
import { saveGitUrl, getGitUrl } from '../utils/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateKnowledge: (knowledge: string) => void;
  onForceReload: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpdateKnowledge, onForceReload }) => {
  const [gitUrl, setGitUrl] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [loading, setLoading] = useState(false);
  const [urlSaving, setUrlSaving] = useState(false);

  const fetchKnowledgeFromUrl = useCallback(async (url: string) => {
    if (!url) {
      setKnowledge('');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      const text = await response.text();
      setKnowledge(text);
      onUpdateKnowledge(text); // Immediately update parent
    } catch (e) {
      console.error("Failed to fetch knowledge from Git", e);
      alert("지식 파일을 불러오는 데 실패했습니다. URL을 확인해주세요.");
      setKnowledge(''); // Clear on failure
    } finally {
      setLoading(false);
    }
  }, [onUpdateKnowledge]);

  useEffect(() => {
    if (isOpen) {
      getGitUrl().then(url => {
        if (url) {
          setGitUrl(url);
          fetchKnowledgeFromUrl(url);
        }
      });
    }
  }, [isOpen, fetchKnowledgeFromUrl]);

  const handleSaveUrl = async () => {
    setUrlSaving(true);
    try {
      await saveGitUrl(gitUrl);
      await fetchKnowledgeFromUrl(gitUrl);
      alert("URL이 저장되었습니다. 이제부터 앱 시작 시 자동으로 이 주소에서 지식을 불러옵니다.");
    } catch(e) {
      alert("URL 저장에 실패했습니다.");
    } finally {
      setUrlSaving(false);
    }
  };

  const handleUpdateGit = () => {
    if (!gitUrl || !gitUrl.includes('raw.githubusercontent.com')) {
      alert("유효한 GitHub Raw URL을 먼저 설정해주세요.");
      return;
    }
    // Convert raw URL to edit URL
    // from: https://raw.githubusercontent.com/USER/REPO/BRANCH/PATH
    // to:   https://github.com/USER/REPO/edit/BRANCH/PATH
    const editUrl = gitUrl
      .replace('raw.githubusercontent.com', 'github.com')
      .replace(/(\/\/[^/]+\/[^/]+\/[^/]+)\//, '$1/edit/');

    const finalUrl = `${editUrl}?value=${encodeURIComponent(knowledge)}`;
    window.open(finalUrl, '_blank');
  };

  const handleReload = () => {
      if(gitUrl) {
          fetchKnowledgeFromUrl(gitUrl);
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI 지식 동기화 (Git Brain)</h2>
              <p className="text-slate-500 text-sm">GitHub 파일을 AI의 두뇌로 사용합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6">
          {/* Step 1: URL Configuration */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <label htmlFor="git-url" className="text-sm font-bold text-slate-700 mb-2 block">
              지식 파일 URL (GitHub Raw)
            </label>
            <div className="flex gap-2">
              <input
                id="git-url"
                type="text"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleSaveUrl}
                disabled={urlSaving}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-70 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {urlSaving ? '저장중...' : 'URL 저장'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              GitHub에 저장된 지식 파일의 'Raw' 버튼을 누른 후의 URL을 입력하세요.
            </p>
          </div>

          {/* Step 2: Knowledge Editor */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-700">학습 내용 편집</h4>
                <button 
                    onClick={handleReload}
                    disabled={loading || !gitUrl}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Git에서 새로고침
                </button>
            </div>
            <textarea
              value={knowledge}
              onChange={(e) => {
                  setKnowledge(e.target.value);
                  onUpdateKnowledge(e.target.value); // Real-time update to parent
              }}
              placeholder="Git URL을 설정하고 저장하면 학습 내용이 여기에 나타납니다..."
              className="w-full h-48 p-4 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm leading-relaxed shadow-inner"
              disabled={!gitUrl}
            />
          </div>
          
           <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-xs flex items-start gap-3 border border-amber-200">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>
                    <strong>중요:</strong> 여기서 수정한 내용은 앱 내에서만 임시 적용됩니다. 영구적으로 변경하려면 반드시 아래 <strong>[GitHub에 저장]</strong> 버튼을 눌러 GitHub 파일을 업데이트해야 합니다.
                </p>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-2xl">
           <button
            onClick={handleUpdateGit}
            disabled={!gitUrl}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Github className="w-4 h-4" />
            {loading ? '로딩 중...' : 'GitHub에 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};
