
export interface QueryHistoryItem {
    id: number;
    name: string;
    query: string;
    timestamp: number;
}

const DB_NAME = 'Winpos3KnowledgeDB';
const DB_VERSION = 5;
const KNOWLEDGE_STORE_NAME = 'knowledgeStore';
const SCHEMA_STORE_NAME = 'schemaStore';
const QUERY_HISTORY_STORE_NAME = 'queryHistoryStore';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(KNOWLEDGE_STORE_NAME)) {
        db.createObjectStore(KNOWLEDGE_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(SCHEMA_STORE_NAME)) {
        db.createObjectStore(SCHEMA_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(QUERY_HISTORY_STORE_NAME)) {
        db.createObjectStore(QUERY_HISTORY_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      // Remove unused stores
      if (db.objectStoreNames.contains('settingsStore')) {
          db.deleteObjectStore('settingsStore');
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
};

// --- Generic Store Functions ---
const getFromStore = async <T>(storeName: string, key: IDBValidKey): Promise<T | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

const putInStore = async (storeName: string, value: any, key: IDBValidKey): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// --- Knowledge (학습 내용) 관련 ---
export const saveKnowledge = (knowledge: string): Promise<void> => {
  return putInStore(KNOWLEDGE_STORE_NAME, knowledge, 'userKnowledge');
};

export const getKnowledge = (): Promise<string | null> => {
    return getFromStore<string>(KNOWLEDGE_STORE_NAME, 'userKnowledge');
};

// --- DB Schema (DB 구조) 관련 ---
export const saveDbSchema = (schema: string): Promise<void> => {
  return putInStore(SCHEMA_STORE_NAME, schema, 'dbSchema');
};

export const getDbSchema = (): Promise<string | null> => {
    return getFromStore<string>(SCHEMA_STORE_NAME, 'dbSchema');
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
        request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
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

// --- Data Backup & Restore ---
export const exportData = async (): Promise<object> => {
    const knowledge = await getKnowledge();
    const schema = await getDbSchema();
    const history = await getAllQueryHistory();

    return {
        knowledge: knowledge || '',
        schema: schema || '',
        history: history || [],
        backupDate: new Date().toISOString()
    };
};

export const importData = async (data: any): Promise<void> => {
    if (!data || typeof data !== 'object') {
        throw new Error("유효하지 않은 데이터 형식입니다.");
    }
    
    // 필수 키 확인 (history는 없을 수도 있으므로 선택적으로 처리)
    if (!('knowledge' in data) && !('schema' in data)) {
        throw new Error("백업 파일에 필수 데이터(knowledge 또는 schema)가 없습니다.");
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            [KNOWLEDGE_STORE_NAME, SCHEMA_STORE_NAME, QUERY_HISTORY_STORE_NAME], 
            'readwrite'
        );
        
        const knowledgeStore = transaction.objectStore(KNOWLEDGE_STORE_NAME);
        const schemaStore = transaction.objectStore(SCHEMA_STORE_NAME);
        const historyStore = transaction.objectStore(QUERY_HISTORY_STORE_NAME);

        // 1. Knowledge 복원
        if (data.knowledge) {
            knowledgeStore.put(data.knowledge, 'userKnowledge');
        }

        // 2. Schema 복원
        if (data.schema) {
            schemaStore.put(data.schema, 'dbSchema');
        }

        // 3. History 복원 (선택적, 기존 데이터를 유지할지 덮어쓸지 결정 필요하나 여기선 병합/추가 방식 사용)
        // 사용자가 복원을 원하면 보통 덮어쓰기나 추가를 기대함. 여기서는 단순 put으로 덮어쓰거나 추가됨.
        if (Array.isArray(data.history)) {
            // 기존 히스토리 클리어 옵션을 줄 수도 있지만, 여기서는 안전하게 추가만 합니다.
            // ID 충돌 방지를 위해 key(id)를 제거하고 새로 추가할 수도 있음.
            // 하지만 완전 복원을 위해 clear 후 add 방식 채택
            historyStore.clear(); 
            data.history.forEach((item: QueryHistoryItem) => {
                if (item.name && item.query) {
                    historyStore.put(item);
                }
            });
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};
