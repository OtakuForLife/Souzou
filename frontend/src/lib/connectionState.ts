/**
 * Global connection state management
 * Tracks whether the server is reachable
 * Updated by the server health check
 */

import { log } from './logger';

class ConnectionState {
  private isOnline: boolean = true;
  private listeners: Set<(online: boolean) => void> = new Set();

  /**
   * Set the online/offline status
   */
  setOnline(online: boolean): void {
    if (this.isOnline !== online) {
      this.isOnline = online;
      log.info(`Connection state changed: ${online ? 'online' : 'offline'}`);
      this.notifyListeners();
    }
  }

  /**
   * Get the current online status
   */
  isServerOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to connection state changes
   */
  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.isOnline);
      } catch (error) {
        log.error('Error in connection state listener', error as Error);
      }
    });
  }
}

// Export singleton instance
export const connectionState = new ConnectionState();
export default connectionState;

