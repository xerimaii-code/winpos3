
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
      
      // Clean up old stores if they exist from previous versions
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

// --- Data Backup & Restore ---
export const exportData = async (): Promise<object> => {
    const knowledge = await getKnowledge() || '';
    const schema = await getDbSchema() || '';
    const history = await getAllQueryHistory() || [];

    return { knowledge, schema, history };
};

export const importData = async (data: any): Promise<void> => {
    if (!data || typeof data !== 'object') {
        throw new Error("Invalid data format for import.");
    }
    const { knowledge, schema, history } = data;
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([KNOWLEDGE_STORE_NAME, SCHEMA_STORE_NAME, QUERY_HISTORY_STORE_NAME], 'readwrite');
        const knowledgeStore = transaction.objectStore(KNOWLEDGE_STORE_NAME);
        const schemaStore = transaction.objectStore(SCHEMA_STORE_NAME);
        const historyStore = transaction.objectStore(QUERY_HISTORY_STORE_NAME);

        // Clear existing data
        knowledgeStore.clear();
        schemaStore.clear();
        historyStore.clear();

        // Import new data
        if (typeof knowledge === 'string') {
            knowledgeStore.put(knowledge, 'userKnowledge');
        }
        if (typeof schema === 'string') {
            schemaStore.put(schema, 'dbSchema');
        }
        if (Array.isArray(history)) {
            history.forEach((item: QueryHistoryItem) => {
                // Ensure data types are correct before putting
                if (item.id && item.name && item.query && item.timestamp) {
                    historyStore.put(item);
                }
            });
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};
