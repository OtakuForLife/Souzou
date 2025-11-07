/**
 * Platform Detection Utility
 * Detects the current platform (Web, Electron, Capacitor/Android)
 */

export type Platform = 'web' | 'electron' | 'capacitor';

/**
 * Detect if running in Electron
 */
export function isElectron(): boolean {
  // Check if running in Electron
  return !!(
    typeof window !== 'undefined' &&
    window.process &&
    (window.process as any).type === 'renderer'
  ) || !!(
    typeof navigator !== 'undefined' &&
    navigator.userAgent &&
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

/**
 * Detect if running in Capacitor (mobile)
 */
export function isCapacitor(): boolean {
  // Check if Capacitor is available
  return !!(
    typeof window !== 'undefined' &&
    (window as any).Capacitor
  );
}

/**
 * Detect if running in a web browser
 */
export function isWeb(): boolean {
  return !isElectron() && !isCapacitor();
}

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  if (isElectron()) {
    return 'electron';
  }
  if (isCapacitor()) {
    return 'capacitor';
  }
  return 'web';
}

/**
 * Get platform-specific database name
 */
export function getDatabaseName(): string {
  const platform = getPlatform();
  
  switch (platform) {
    case 'electron':
      return 'souzou-electron.db';
    case 'capacitor':
      return 'souzou-mobile.db';
    case 'web':
    default:
      return 'souzou-web';
  }
}

/**
 * Check if the platform supports SQLite
 */
export function supportsSQLite(): boolean {
  return isElectron() || isCapacitor();
}

/**
 * Check if the platform supports IndexedDB
 */
export function supportsIndexedDB(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(): string {
  const platform = getPlatform();
  
  switch (platform) {
    case 'electron':
      return 'Desktop (Electron)';
    case 'capacitor':
      return 'Mobile (Android)';
    case 'web':
    default:
      return 'Web Browser';
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    process?: any;
    Capacitor?: any;
    nativeDB?: {
      exec: (sql: string, params?: any[]) => Promise<any>;
    };
  }
}

export default {
  isElectron,
  isCapacitor,
  isWeb,
  getPlatform,
  getDatabaseName,
  supportsSQLite,
  supportsIndexedDB,
  getPlatformDisplayName,
};

