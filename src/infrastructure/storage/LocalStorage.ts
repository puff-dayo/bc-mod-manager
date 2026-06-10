import {Logger} from "@/infrastructure/logging/Logger";

/**
 * LocalStorage - Handles all localStorage operations
 * Provides a centralized way to interact with the browser's localStorage.
 */
export class LocalStorage {
  /**
   * Get an item from localStorage
   * @param key - The key to retrieve
   * @returns The parsed value or null if not found
   */
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      Logger.error(`Error getting item from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set an item in localStorage
   * @param key - The key to store
   * @param value - The value to store (will be JSON stringified)
   */
  static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      Logger.error(`Error setting item in localStorage: ${key}`, error);
    }
  }

  /**
   * Remove an item from localStorage
   * @param key - The key to remove
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      Logger.error(`Error removing item from localStorage: ${key}`, error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      Logger.error('Error clearing localStorage', error);
    }
  }
}
