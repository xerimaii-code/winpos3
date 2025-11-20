
import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Trash2 } from 'lucide-react';
import { saveKnowledge, getKnowledge } from '../utils/db';

interface LearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (knowledge: string) => void;
}

export const LearningModal: React.FC<LearningModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [knowledge, setKnowledge] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFromDb();
    }
  }, [isOpen]);

  const loadFromDb = async () => {
    const saved = await getKnowledge();
    setKnowledge(saved);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveKnowledge(knowledge);
      onUpdate(knowledge); // 부모 컴포넌트(Simulator)에 업데이트 알림
      onClose();
    } catch (e) {
      console.error("Failed to save knowledge", e);
      alert("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI 심화 학습 (Deep Learning)</h2>
              <p className="text-slate-500 text-sm">Winpos3만의 업무 규칙이나 테이블 관계를 가르쳐주세요.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
            <h4 className="text-sm font-bold text-slate-700 mb-2">💡 작성 팁</h4>
            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
              <li>특정 컬럼의 값(Code)이 무엇을 의미하는지 적어주세요. (예: sale_status가 '9'면 반품이다)</li>
              <li>테이블 간의 조인 관계를 설명해주세요. (예: goods 테이블의 gcode와 sale_dtl의 gcode는 같다)</li>
              <li>비즈니스 용어를 정의해주세요. (예: '객단가'는 총매출액 나누기 영수증건수이다)</li>
            </ul>
          </div>
          
          <textarea
            value={knowledge}
            onChange={(e) => setKnowledge(e.target.value)}
            placeholder="예시: outm_yymm 테이블에서 sale_date는 판매일자이고, tot_sale_amt는 총매출액입니다. 반품된 영수증은 제외하고 계산해야 합니다..."
            className="w-full h-64 p-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700 leading-relaxed shadow-inner"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {loading ? '저장 중...' : '학습 내용 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};
