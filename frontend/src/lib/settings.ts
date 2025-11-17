import { STORAGE_KEYS, API_CONFIG } from '@/config/constants';


function isValidAbsoluteUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getBackendURL(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.BACKEND_URL_KEY);
    if (stored && isValidAbsoluteUrl(stored)) return stored;

    // Backward compatibility: migrate host/port if present
    const host = window.localStorage.getItem(STORAGE_KEYS.BACKEND_HOST_KEY) || 'localhost';
    const portStr = window.localStorage.getItem(STORAGE_KEYS.BACKEND_PORT_KEY) || '8000';
    const port = parseInt(portStr, 10);
    const fallback = `http://${host}:${Number.isFinite(port) ? port : 8000}`;
    return isValidAbsoluteUrl(fallback) ? fallback : API_CONFIG.DEFAULT_BACKEND_URL;
  } catch {
    return API_CONFIG.DEFAULT_BACKEND_URL;
  }
}

export function setBackendURL(url: string): void {
  try {
    const value = (url || '').trim();
    const finalUrl = isValidAbsoluteUrl(value) ? value : API_CONFIG.DEFAULT_BACKEND_URL;
    window.localStorage.setItem(STORAGE_KEYS.BACKEND_URL_KEY, finalUrl);
  } catch {
    // no-op
  }
}

export function getSyncEnabled(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.SYNC_ENABLED_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setSyncEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.SYNC_ENABLED_KEY, enabled.toString());
  } catch {
    // no-op
  }
}

