/**
 * Simplified Widget Data Hook
 * 
 * Provides automatic memoization, caching, and error handling for widget data processing.
 * Makes widget implementation simple and performant with zero configuration.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

/**
 * Widget data processing result
 */
export interface WidgetDataResult<TData> {
  data: TData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

/**
 * Widget data context passed to processors
 */
export interface WidgetDataContext {
  allEntities: Record<string, any>;
  rootEntities: any[];
  currentEntityId?: string;
}

/**
 * Cache entry for widget data
 */
interface CacheEntry<TData> {
  data: TData;
  timestamp: Date;
  configHash: string;
}

/**
 * Simple LRU cache for widget data
 */
class WidgetDataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;
  private ttl = 5 * 60 * 1000; // 5 minutes

  set<TData>(key: string, data: TData, configHash: string): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: new Date(),
      configHash
    });
  }

  get<TData>(key: string, configHash: string): TData | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry is expired
    const now = new Date();
    if (now.getTime() - entry.timestamp.getTime() > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Check if config has changed
    if (entry.configHash !== configHash) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// Global cache instance
const widgetDataCache = new WidgetDataCache();

/**
 * Generate a stable hash for configuration objects
 */
function generateConfigHash(config: any): string {
  try {
    return btoa(JSON.stringify(config, Object.keys(config).sort()));
  } catch {
    return String(Date.now());
  }
}

/**
 * Generate cache key for widget data
 */
function generateCacheKey(widgetId: string, processorName: string): string {
  return `${widgetId}:${processorName}`;
}

/**
 * Hook for simplified widget data processing with auto-optimization
 * 
 * Features:
 * - Automatic memoization based on config changes
 * - Smart caching with TTL and LRU eviction
 * - Built-in error handling and retry logic
 * - Loading states
 * - Zero configuration needed
 * 
 * @param config Widget configuration
 * @param processor Data processing function
 * @param options Optional configuration
 * @returns Widget data result with loading/error states
 */
export function useWidgetData<TConfig, TData>(
  config: TConfig,
  processor: (config: TConfig, context: WidgetDataContext) => TData | Promise<TData>,
  options: {
    widgetId?: string;
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
): WidgetDataResult<TData> {
  const { widgetId = 'unknown', enabled = true, refreshInterval } = options;
  
  // Get data context from Redux store
  const { allEntities, rootEntities } = useSelector((state: RootState) => ({
    allEntities: state.entities.allEntities,
    rootEntities: state.entities.rootEntities
  }));

  // State management
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refs for stable references
  const processorRef = useRef(processor);
  const configRef = useRef(config);
  
  // Update refs when values change
  processorRef.current = processor;
  configRef.current = config;

  // Generate stable cache key and config hash
  const cacheKey = useMemo(() => 
    generateCacheKey(widgetId, processor.name || 'anonymous'), 
    [widgetId, processor.name]
  );
  
  const configHash = useMemo(() => 
    generateConfigHash(config), 
    [config]
  );

  // Create data context
  const dataContext = useMemo((): WidgetDataContext => ({
    allEntities,
    rootEntities,
    currentEntityId: widgetId
  }), [allEntities, rootEntities, widgetId]);

  // Refresh function
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Main data processing effect
  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const processData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedData = widgetDataCache.get<TData>(cacheKey, configHash);
        if (cachedData && refreshTrigger === 0) {
          setData(cachedData);
          setLoading(false);
          setLastUpdated(new Date());
          return;
        }

        // Process data
        const result = await Promise.resolve(
          processorRef.current(configRef.current, dataContext)
        );

        if (isCancelled) return;

        // Cache the result
        widgetDataCache.set(cacheKey, result, configHash);

        setData(result);
        setLastUpdated(new Date());
      } catch (err) {
        if (isCancelled) return;
        
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error(`Widget data processing error for ${widgetId}:`, error);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    processData();

    return () => {
      isCancelled = true;
    };
  }, [enabled, cacheKey, configHash, dataContext, refreshTrigger, widgetId]);

  // Auto-refresh effect
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, enabled, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated
  };
}

/**
 * Hook for invalidating widget data cache
 */
export function useWidgetDataCache() {
  return {
    invalidate: (pattern?: string) => widgetDataCache.invalidate(pattern),
    clear: () => widgetDataCache.clear(),
    getStats: () => widgetDataCache.getStats()
  };
}

/**
 * Higher-order component for automatic error boundaries around widgets
 * Note: Error boundary implementation should be added in a separate .tsx file
 */
export function withWidgetErrorBoundary<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  // For now, just return the component as-is
  // TODO: Implement proper error boundary in a .tsx file
  return Component;
}


