
const DB_NAME = 'Winpos3KnowledgeDB';
const STORE_NAME = 'knowledgeStore';
const SETTINGS_STORE_NAME = 'settingsStore'; // 설정 저장소 추가
const KEY = 'customContext';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // 버전 업그레이드 (1 -> 2)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 지식 저장소
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }

      // 설정 저장소 (신규)
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME);
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

// --- Knowledge (심화학습) 관련 ---

export const saveKnowledge = async (knowledge: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(knowledge, KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getKnowledge = async (): Promise<string> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(KEY);

    request.onsuccess = () => {
      resolve(request.result || '');
    };
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

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
};
