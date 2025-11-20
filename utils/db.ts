

export interface QueryHistoryItem {
    id: number;
    name: string;
    query: string;
    timestamp: number;
}

const DB_NAME = 'Winpos3KnowledgeDB';
const KNOWLEDGE_STORE_NAME = 'knowledgeStore';
const SETTINGS_STORE_NAME = 'settingsStore';
const QUERY_HISTORY_STORE_NAME = 'queryHistoryStore';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 4); // Version up for new store

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(KNOWLEDGE_STORE_NAME)) {
        db.createObjectStore(KNOWLEDGE_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(QUERY_HISTORY_STORE_NAME)) {
        db.createObjectStore(QUERY_HISTORY_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
};

// --- Knowledge (학습 내용) 관련 ---
export const saveKnowledge = async (knowledge: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KNOWLEDGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(KNOWLEDGE_STORE_NAME);
    const request = store.put(knowledge, 'userKnowledge');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getKnowledge = async (): Promise<string | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KNOWLEDGE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(KNOWLEDGE_STORE_NAME);
      const request = store.get('userKnowledge');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
};

// --- Settings (기기 설정) 관련 ---
export const saveDeviceSetting = async (key: string, value: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getDeviceSetting = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};


// --- Query History 관련 ---
export const saveQueryHistory = async (item: Omit<QueryHistoryItem, 'id' | 'timestamp'> & { id?: number }): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([QUERY_HISTORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(QUERY_HISTORY_STORE_NAME);
        const itemToSave = { ...item, timestamp: Date.now() };
        const request = store.put(itemToSave);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getAllQueryHistory = async (): Promise<QueryHistoryItem[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([QUERY_HISTORY_STORE_NAME], 'readonly');
        const store = transaction.objectStore(QUERY_HISTORY_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp)); // Sort by newest first
        request.onerror = () => reject(request.error);
    });
};

export const deleteQueryHistory = async (id: number): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([QUERY_HISTORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(QUERY_HISTORY_STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
