import { useState } from 'react';
import { log } from '@/lib/logger';

/**
 * Custom hook for managing localStorage with type safety and error handling
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      log.error(`Error reading localStorage key "${key}"`, error as Error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      log.debug(`Saved to localStorage`, { key, value: valueToStore });
    } catch (error) {
      log.error(`Error setting localStorage key "${key}"`, error as Error);
    }
  };

  // Function to remove the item from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      log.debug(`Removed from localStorage`, { key });
    } catch (error) {
      log.error(`Error removing localStorage key "${key}"`, error as Error);
    }
  };

  return [storedValue, setValue, removeValue];
}
