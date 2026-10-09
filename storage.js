/**
 * storage.js — 拼豆王国 本地历史作品存储
 * IndexedDB 为主，localStorage 降级。所有方法返回 Promise。
 */
(function (global) {
  'use strict';
  const DB_NAME = 'pindou-db';
  const STORE = 'projects';
  const LS_KEY = 'pindou-projects';
  let _db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!global.indexedDB) { reject(new Error('IDB unavailable')); return; }
      if (_db) { resolve(_db); return; }
      const req = global.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror = (e) => reject(e.target.error || new Error('IDB open failed'));
    });
  }

  const idbAll = () => openDB().then((db) => new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));

  const idbPut = (project) => openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(project);
    tx.oncomplete = () => resolve(project);
    tx.onerror = () => reject(tx.error);
  }));

  const idbGet = (id) => openDB().then((db) => new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));

  const idbDelete = (id) => openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));

  const lsRead = () => {
    try { return JSON.parse(global.localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  };
  const lsWrite = (list) => { global.localStorage.setItem(LS_KEY, JSON.stringify(list)); };

  const PDStorage = {
    _mode: null,
    _modeReady: openDB().then(() => { PDStorage._mode = 'idb'; })
      .catch(() => { PDStorage._mode = 'ls'; }),

    ready: () => PDStorage._modeReady,

    _id: () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),

    saveProject: (project) => PDStorage.ready().then(() => {
      project.updatedAt = Date.now();
      if (PDStorage._mode === 'idb') return idbPut(project);
      const list = lsRead();
      const i = list.findIndex((p) => p.id === project.id);
      if (i >= 0) list[i] = project; else list.push(project);
      lsWrite(list);
      return project;
    }),

    listProjects: () => PDStorage.ready().then(() => {
      if (PDStorage._mode === 'idb') return idbAll();
      return lsRead();
    }).then((list) => list.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map((p) => ({
        id: p.id, name: p.name, source: p.source, palette: p.palette,
        width: p.width, height: p.height, thumbnail: p.thumbnail,
        createdAt: p.createdAt, updatedAt: p.updatedAt
      }))),

    getProject: (id) => PDStorage.ready().then(() => {
      if (PDStorage._mode === 'idb') return idbGet(id);
      return lsRead().find((p) => p.id === id) || null;
    }),

    deleteProject: (id) => PDStorage.ready().then(() => {
      if (PDStorage._mode === 'idb') return idbDelete(id);
      lsWrite(lsRead().filter((p) => p.id !== id));
    }),

    renameProject: (id, newName) => PDStorage.getProject(id).then((p) => {
      if (!p) return null;
      p.name = String(newName || '').trim() || '未命名';
      return PDStorage.saveProject(p);
    }),

    exportProject: (id) => PDStorage.getProject(id).then((p) => {
      if (!p) throw new Error('项目不存在');
      const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pindou-' + (p.name || 'project') + '-' + Date.now() + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return p;
    }),

    importProject: (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let p;
        try { p = JSON.parse(reader.result); }
        catch (e) { reject(new Error('文件解析失败')); return; }
        if (!p || p.schemaVersion !== 1 || !Array.isArray(p.cells) || !p.width || !p.height || !Array.isArray(p.colorTable)) {
          reject(new Error('文件格式不正确')); return;
        }
        if (!p.id) p.id = PDStorage._id();
        p.createdAt = p.createdAt || Date.now();
        PDStorage.saveProject(p).then(() => resolve(p), reject);
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    }),

    buildThumbnail: (cells, colorTable) => {
      try {
        const h = cells.length, w = cells[0] ? cells[0].length : 0;
        if (!w || !h) return '';
        const max = 256;
        const scale = Math.max(1, Math.floor(max / Math.max(w, h)));
        const c = document.createElement('canvas');
        c.width = w * scale; c.height = h * scale;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#f5f5f0'; ctx.fillRect(0, 0, c.width, c.height);
        for (let y = 0; y < h; y++) {
          const row = cells[y];
          for (let x = 0; x < w; x++) {
            const idx = row[x];
            if (idx >= 0 && colorTable[idx]) {
              ctx.fillStyle = colorTable[idx].hex;
              ctx.fillRect(x * scale, y * scale, scale, scale);
            }
          }
        }
        return c.toDataURL('image/png');
      } catch (e) { return ''; }
    }
  };

  global.PDStorage = PDStorage;
})(window);
