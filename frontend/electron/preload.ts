// Electron preload skeleton
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nativeDB', {
  exec: (sql: string, params?: any[]) => ipcRenderer.invoke('db:exec', sql, params),
});

export {};
