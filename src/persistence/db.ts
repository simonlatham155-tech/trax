/**
 * IndexedDB wrapper for TRAX project persistence.
 *
 * Schema
 * ------
 * DB: "trax-db"  version 1
 *   objectStore "projects"   keyPath: "id"
 *     { id, name, updatedAt, createdAt, data: SerializedProject }
 *   objectStore "audio_files" keyPath: "id"
 *     { id, arrayBuffer: ArrayBuffer }
 */

const DB_NAME = 'trax-db';
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('audio_files')) {
        db.createObjectStore('audio_files', { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

function tx(
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode = 'readonly'
): IDBTransaction {
  return db.transaction(stores, mode);
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: unknown;
}

export async function saveProject(record: ProjectRecord): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'projects', 'readwrite').objectStore('projects');
  await wrap(store.put(record));
}

export async function loadProject(id: string): Promise<ProjectRecord | undefined> {
  const db = await openDB();
  const store = tx(db, 'projects').objectStore('projects');
  return wrap<ProjectRecord | undefined>(store.get(id));
}

export async function listProjects(): Promise<Omit<ProjectRecord, 'data'>[]> {
  const db = await openDB();
  const store = tx(db, 'projects').objectStore('projects');
  const all = await wrap<ProjectRecord[]>(store.getAll());
  return all.map(({ id, name, createdAt, updatedAt }) => ({
    id,
    name,
    createdAt,
    updatedAt,
  }));
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  const t = tx(db, ['projects', 'audio_files'], 'readwrite');
  const proj = await wrap<ProjectRecord | undefined>(t.objectStore('projects').get(id));
  if (proj) {
    const data = proj.data as { audioFileIds?: string[] };
    for (const fileId of data.audioFileIds ?? []) {
      t.objectStore('audio_files').delete(fileId);
    }
  }
  t.objectStore('projects').delete(id);
  await new Promise<void>((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

// ─── Audio files ─────────────────────────────────────────────────────────────

export async function saveAudioFile(id: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'audio_files', 'readwrite').objectStore('audio_files');
  await wrap(store.put({ id, arrayBuffer: buffer }));
}

export async function loadAudioFile(id: string): Promise<ArrayBuffer | undefined> {
  const db = await openDB();
  const store = tx(db, 'audio_files').objectStore('audio_files');
  const rec = await wrap<{ id: string; arrayBuffer: ArrayBuffer } | undefined>(store.get(id));
  return rec?.arrayBuffer;
}

export async function deleteAudioFile(id: string): Promise<void> {
  const db = await openDB();
  const store = tx(db, 'audio_files', 'readwrite').objectStore('audio_files');
  await wrap(store.delete(id));
}
