
const DB_NAME = 'Winpos3KnowledgeDB';
const KNOWLEDGE_STORE_NAME = 'knowledgeStore';
const SETTINGS_STORE_NAME = 'settingsStore';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3); // Version up to handle schema change

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(KNOWLEDGE_STORE_NAME)) {
        db.createObjectStore(KNOWLEDGE_STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
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

// Git URL 저장/불러오기 헬퍼
export const saveGitUrl = async (url: string) => saveDeviceSetting('gitKnowledgeUrl', url);
export const getGitUrl = async () => getDeviceSetting('gitKnowledgeUrl');
