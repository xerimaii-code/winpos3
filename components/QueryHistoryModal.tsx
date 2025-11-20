
import React, { useState, useEffect, useCallback } from 'react';
import { X, History, Trash2, Edit, Save, Check, Copy } from 'lucide-react';
import { QueryHistoryItem, getAllQueryHistory, saveQueryHistory, deleteQueryHistory } from '../utils/db';

interface QueryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseQuery: (name: string, query: string) => void;
}

export const QueryHistoryModal: React.FC<QueryHistoryModalProps> = ({ isOpen, onClose, onUseQuery }) => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<QueryHistoryItem | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedQuery, setEditedQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    const items = await getAllQueryHistory();
    setHistory(items);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const handleDelete = async (id: number) => {
    if (window.confirm("정말로 이 쿼리를 삭제하시겠습니까?")) {
      await deleteQueryHistory(id);
      fetchHistory(); // Refresh list
    }
  };

  const handleEdit = (item: QueryHistoryItem) => {
    setEditingItem(item);
    setEditedName(item.name);
    setEditedQuery(item.query);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await saveQueryHistory({ ...editingItem, name: editedName, query: editedQuery });
    setEditingItem(null);
    fetchHistory();
  };
  
  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    // You can add a toast notification here
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3"><div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><History className="w-6 h-6" /></div><div><h2 className="text-xl font-bold text-slate-800">쿼리 히스토리</h2><p className="text-slate-500 text-sm">저장된 쿼리를 관리하고 재사용합니다.</p></div></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-50">
          {history.length > 0 ? (
            <ul className="space-y-3">
              {history.map(item => (
                <li key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-rose-300 hover:shadow-md">
                  {editingItem?.id === item.id ? (
                    <div className="space-y-3">
                        <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-sm font-bold" />
                        <textarea value={editedQuery} onChange={e => setEditedQuery(e.target.value)} rows={4} className="w-full p-2 border border-slate-300 rounded-md font-mono text-xs" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingItem(null)} className="px-3 py-1 text-xs rounded-md bg-slate-200 hover:bg-slate-300">취소</button>
                            <button onClick={handleSaveEdit} className="px-3 py-1 text-xs rounded-md bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1"><Save className="w-3 h-3"/> 저장</button>
                        </div>
                    </div>
                  ) : (
                    <div>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800 break-all">{item.name}</h4>
                                <p className="text-xs text-slate-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => handleEdit(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="relative mt-3 p-3 bg-slate-100 rounded-lg">
                            <pre className="font-mono text-xs text-slate-600 whitespace-pre-wrap break-all overflow-x-auto">{item.query}</pre>
                            <button onClick={() => handleCopyQuery(item.query)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:bg-slate-200 rounded-md"><Copy className="w-3.5 h-3.5"/></button>
                        </div>
                        <button onClick={() => onUseQuery(item.name, item.query)} className="mt-3 w-full text-center py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                           <Check className="w-4 h-4" /> 이 쿼리 사용하기
                        </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="font-bold">저장된 쿼리가 없습니다.</p>
              <p className="text-sm">쿼리를 실행한 후 결과창에서 저장할 수 있습니다.</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl"><button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition-all">닫기</button></div>
      </div>
    </div>
  );
};
