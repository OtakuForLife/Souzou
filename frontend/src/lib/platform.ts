/**
 * Platform Detection Utility
 * Detects the current platform (Web, Electron, Capacitor/Android)
 */

export enum Platform {
  WEB = 'web',
  ELECTRON = 'electron',
  CAPACITOR = 'capacitor',
}

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
    return Platform.ELECTRON;
  }
  if (isCapacitor()) {
    return Platform.CAPACITOR;
  }
  return Platform.WEB;
}

/**
 * Get platform-specific database name
 */
export function getDatabaseName(): string {
  const platform = getPlatform();
  
  switch (platform) {
    case Platform.ELECTRON:
      return 'souzou-electron.db';
    case Platform.CAPACITOR:
      return 'souzou-mobile.db';
    case Platform.WEB:
    default:
      return 'souzou-web';
  }
}


/**
 * Get platform display name
 */
export function getPlatformDisplayName(): string {
  const platform = getPlatform();
  
  switch (platform) {
    case Platform.ELECTRON:
      return 'Desktop (Electron)';
    case Platform.CAPACITOR:
      return 'Mobile (Android)';
    case Platform.WEB:
    default:
      return 'Web Browser';
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    process?: any;
    Capacitor?: any;
  }
}

export default {
  isElectron,
  isCapacitor,
  isWeb,
  getPlatform,
  getDatabaseName,
  getPlatformDisplayName,
};

