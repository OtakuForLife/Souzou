export const DEFAULT_BACKEND_URL = 'http://localhost:8000';

const BACKEND_URL_KEY = 'backend_url';
const BACKEND_HOST_KEY = 'backend_host';
const BACKEND_PORT_KEY = 'backend_port';
const SYNC_ENABLED_KEY = 'sync_enabled';

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
    const stored = window.localStorage.getItem(BACKEND_URL_KEY);
    if (stored && isValidAbsoluteUrl(stored)) return stored;

    // Backward compatibility: migrate host/port if present
    const host = window.localStorage.getItem(BACKEND_HOST_KEY) || 'localhost';
    const portStr = window.localStorage.getItem(BACKEND_PORT_KEY) || '8000';
    const port = parseInt(portStr, 10);
    const fallback = `http://${host}:${Number.isFinite(port) ? port : 8000}`;
    return isValidAbsoluteUrl(fallback) ? fallback : DEFAULT_BACKEND_URL;
  } catch {
    return DEFAULT_BACKEND_URL;
  }
}

export function setBackendURL(url: string): void {
  try {
    const value = (url || '').trim();
    const finalUrl = isValidAbsoluteUrl(value) ? value : DEFAULT_BACKEND_URL;
    window.localStorage.setItem(BACKEND_URL_KEY, finalUrl);
  } catch {
    // no-op
  }
}

export function getSyncEnabled(): boolean {
  try {
    const stored = window.localStorage.getItem(SYNC_ENABLED_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setSyncEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(SYNC_ENABLED_KEY, enabled.toString());
  } catch {
    // no-op
  }
}

