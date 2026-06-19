// Service de stockage offline avec IndexedDB
const DB_NAME = "gestion-materiaux-offline";
const DB_VERSION = 1;

interface OfflineData {
  collection: string;
  data: any[];
  timestamp: number;
}

interface PendingOperation {
  id: string;
  collection: string;
  operation: "add" | "update" | "delete";
  data: any;
  timestamp: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour les données en cache
        if (!db.objectStoreNames.contains("cache")) {
          db.createObjectStore("cache", { keyPath: "collection" });
        }

        // Store pour les opérations en attente
        if (!db.objectStoreNames.contains("pendingOps")) {
          const store = db.createObjectStore("pendingOps", { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  // ========== CACHE DATA ==========
  async cacheData(collection: string, data: any[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readwrite");
      const store = transaction.objectStore("cache");

      const cacheEntry: OfflineData = {
        collection,
        data,
        timestamp: Date.now(),
      };

      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(collection: string): Promise<any[] | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readonly");
      const store = transaction.objectStore("cache");
      const request = store.get(collection);

      request.onsuccess = () => {
        const result = request.result as OfflineData;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(collection?: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readwrite");
      const store = transaction.objectStore("cache");

      if (collection) {
        const request = store.delete(collection);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } else {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }
    });
  }

  // ========== PENDING OPERATIONS ==========
  async addPendingOperation(
    collection: string,
    operation: "add" | "update" | "delete",
    data: any
  ): Promise<string> {
    if (!this.db) await this.init();

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingOps"], "readwrite");
      const store = transaction.objectStore("pendingOps");

      const pendingOp: PendingOperation = {
        id,
        collection,
        operation,
        data,
        timestamp: Date.now(),
      };

      const request = store.add(pendingOp);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingOps"], "readonly");
      const store = transaction.objectStore("pendingOps");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingOperation(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingOps"], "readwrite");
      const store = transaction.objectStore("pendingOps");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingOperations(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pendingOps"], "readwrite");
      const store = transaction.objectStore("pendingOps");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
