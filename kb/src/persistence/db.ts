import type { Article } from '@/types';

const DB_NAME = 'phkb-db';
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('articles')) {
        const store = db.createObjectStore('articles', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('year', 'year', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveArticle(article: Article): Promise<void> {
  const db = await openDB();
  const store = db.transaction('articles', 'readwrite').objectStore('articles');
  await wrap(store.put(article));
}

export async function getArticle(id: string): Promise<Article | undefined> {
  const db = await openDB();
  const store = db.transaction('articles').objectStore('articles');
  return wrap<Article | undefined>(store.get(id));
}

export async function listArticles(): Promise<Article[]> {
  const db = await openDB();
  const store = db.transaction('articles').objectStore('articles');
  return wrap<Article[]>(store.getAll());
}

export async function deleteArticle(id: string): Promise<void> {
  const db = await openDB();
  const store = db.transaction('articles', 'readwrite').objectStore('articles');
  await wrap(store.delete(id));
}

export async function bulkSaveArticles(articles: Article[]): Promise<void> {
  const db = await openDB();
  const t = db.transaction('articles', 'readwrite');
  const store = t.objectStore('articles');
  for (const a of articles) {
    store.put(a);
  }
  await new Promise<void>((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

export async function clearAllArticles(): Promise<void> {
  const db = await openDB();
  const store = db.transaction('articles', 'readwrite').objectStore('articles');
  await wrap(store.clear());
}
