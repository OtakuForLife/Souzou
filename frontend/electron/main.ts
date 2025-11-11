/**
 * Electron main process
 *
 * This file handles:
 * - Window creation and lifecycle
 * - Capacitor SQLite plugin initialization
 */

import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function createWindow() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  // Log when preload script should be loaded
  win.webContents.on('did-finish-load', () => {
    console.log('[Main] Page loaded');
  });

  // In dev, Vite serves; in prod, load the built index.html
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173'
  if (!app.isPackaged) {
    win.loadURL(devUrl)
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

