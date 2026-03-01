const DB_NAME = "scenepilot_local_refs";
const STORE_NAME = "refs";
const DB_VER = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function runTx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

export function refBlobKey(refId: string): string {
  return `ref:${refId}`;
}

export function putRefBlob(refId: string, blob: Blob): Promise<void> {
  return runTx("readwrite", (store) => store.put(blob, refBlobKey(refId))).then(() => undefined);
}

export function getRefBlob(refId: string): Promise<Blob | undefined> {
  return runTx("readonly", (store) => store.get(refBlobKey(refId)));
}

export function deleteRefBlob(refId: string): Promise<void> {
  return runTx("readwrite", (store) => store.delete(refBlobKey(refId))).then(() => undefined);
}
