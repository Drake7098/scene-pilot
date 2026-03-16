import { useState, useCallback } from "react";

export type LibraryEntry = { name: string; kind: "file" | "directory"; label: string };

const LIB_DB_NAME = "scenepilot_library_handles";
const LIB_DB_STORE = "handles";
const LIB_DB_VER = 1;
const LIB_ROOT_KEY = "root";
const LIB_INIT_KEY = "spx_library_initialized";

function openLibDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LIB_DB_NAME, LIB_DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LIB_DB_STORE)) db.createObjectStore(LIB_DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePersistedLibraryRootHandle(handle: any): Promise<void> {
  const db = await openLibDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(LIB_DB_STORE, "readwrite");
    const store = tx.objectStore(LIB_DB_STORE);
    const req = store.put(handle, LIB_ROOT_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadPersistedLibraryRootHandle(): Promise<any | null> {
  const db = await openLibDb();
  return await new Promise<any | null>((resolve, reject) => {
    const tx = db.transaction(LIB_DB_STORE, "readonly");
    const store = tx.objectStore(LIB_DB_STORE);
    const req = store.get(LIB_ROOT_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export function useLibraryState(lang: string) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryRootHandle, setLibraryRootHandle] = useState<any>(null);
  const [libraryRootName, setLibraryRootName] = useState("");
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>([]);
  const [libraryProjectName, setLibraryProjectName] = useState<string | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [libraryHint, setLibraryHint] = useState("");

  const refreshLibraryEntries = useCallback(async (root: any, projectName?: string | null) => {
    try {
      const out: LibraryEntry[] = [];
      const target = projectName ? await root.getDirectoryHandle(projectName) : root;
      for await (const [, handle] of target.entries()) {
        if (handle.kind === "file" && /\.json$/i.test(handle.name)) {
          out.push({ name: handle.name, kind: handle.kind, label: handle.name.replace(/\.json$/i, "") });
        } else if (handle.kind === "directory") {
          out.push({ name: handle.name, kind: handle.kind, label: handle.name });
        }
      }
      out.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }));
      setLibraryEntries(out);
    } catch {
      setLibraryEntries([]);
    }
  }, []);

  function hasDirectoryPicker() {
    if (typeof window === "undefined") return false;
    return "showDirectoryPicker" in window;
  }

  async function ensureLibraryRoot(pickIfMissing = true): Promise<any | null> {
    if (!hasDirectoryPicker()) {
      setLibraryHint(lang === "zh" ? "当前浏览器不支持目录选择" : "Directory picker is not supported in this browser");
      return null;
    }
    if (libraryRootHandle) return libraryRootHandle;
    if (!pickIfMissing) return null;
    try {
      const inited = (() => { try { return localStorage.getItem(LIB_INIT_KEY) === "1"; } catch { return false; } })();
      setLibraryHint(
        inited
          ? lang === "zh" ? "需要重新确认分镜库目录权限。" : "Please re-confirm library folder permission."
          : lang === "zh" ? "请选择分镜库目录。" : "Choose your storyboard library folder."
      );
      const picker = (window as any).showDirectoryPicker;
      const picked = await picker({ mode: "readwrite", id: "scenepilotix-library-root" });
      let root = picked;
      if (picked.name !== "ScenePilotix") {
        try { root = await picked.getDirectoryHandle("ScenePilotix"); } catch { root = picked; }
      }
      setLibraryRootHandle(root);
      setLibraryRootName(root.name || "ScenePilotix");
      setLibraryProjectName(null);
      await savePersistedLibraryRootHandle(root);
      try { localStorage.setItem(LIB_INIT_KEY, "1"); } catch { /* ignore */ }
      await refreshLibraryEntries(root, null);
      setLibraryHint(lang === "zh" ? `已连接分镜库：${root.name}` : `Connected library: ${root.name}`);
      return root;
    } catch {
      return null;
    }
  }

  return {
    libraryOpen, setLibraryOpen,
    libraryRootHandle, setLibraryRootHandle,
    libraryRootName, setLibraryRootName,
    libraryEntries,
    libraryProjectName, setLibraryProjectName,
    libraryBusy, setLibraryBusy,
    libraryHint, setLibraryHint,
    refreshLibraryEntries,
    hasDirectoryPicker,
    ensureLibraryRoot,
  };
}
