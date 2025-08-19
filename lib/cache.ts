/**
 * Advanced Caching System for ThinkSpace
 * 
 * Provides multi-level caching with memory, localStorage, and IndexedDB
 * for optimal performance across all PARA categories.
 */

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
  tags: string[];
  size: number; // Approximate size in bytes
}

// Cache configuration
interface CacheConfig {
  maxMemorySize: number; // Max memory cache size in bytes
  maxLocalStorageSize: number; // Max localStorage size in bytes
  defaultTTL: number; // Default TTL in milliseconds
  enableCompression: boolean;
  enableIndexedDB: boolean;
}

// Cache statistics
interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  localStorageHits: number;
  localStorageMisses: number;
  indexedDBHits: number;
  indexedDBMisses: number;
  totalSize: number;
  entryCount: number;
}

// Cache levels
type CacheLevel = 'memory' | 'localStorage' | 'indexedDB';

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxMemorySize: 50 * 1024 * 1024, // 50MB
  maxLocalStorageSize: 10 * 1024 * 1024, // 10MB
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  enableCompression: true,
  enableIndexedDB: true,
};

// Advanced Cache Manager
export class AdvancedCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats;
  private dbName = 'thinkspace-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      localStorageHits: 0,
      localStorageMisses: 0,
      indexedDBHits: 0,
      indexedDBMisses: 0,
      totalSize: 0,
      entryCount: 0,
    };

    this.initializeIndexedDB();
    this.startCleanupInterval();
  }

  // Initialize IndexedDB
  private async initializeIndexedDB(): Promise<void> {
    if (!this.config.enableIndexedDB || typeof window === 'undefined') {
      return;
    }

    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.warn('Failed to open IndexedDB for caching');
      };

      request.onsuccess = () => {
        this.db = request.result;
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      };
    } catch (error) {
      console.warn('IndexedDB not available:', error);
    }
  }

  // Get data from cache with fallback strategy
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      this.stats.memoryHits++;
      return memoryResult;
    }
    this.stats.memoryMisses++;

    // Try localStorage
    const localStorageResult = await this.getFromLocalStorage<T>(key);
    if (localStorageResult !== null) {
      this.stats.localStorageHits++;
      // Promote to memory cache
      this.setInMemory(key, localStorageResult, this.config.defaultTTL);
      return localStorageResult;
    }
    this.stats.localStorageMisses++;

    // Try IndexedDB
    const indexedDBResult = await this.getFromIndexedDB<T>(key);
    if (indexedDBResult !== null) {
      this.stats.indexedDBHits++;
      // Promote to higher levels
      this.setInMemory(key, indexedDBResult, this.config.defaultTTL);
      await this.setInLocalStorage(key, indexedDBResult, this.config.defaultTTL);
      return indexedDBResult;
    }
    this.stats.indexedDBMisses++;

    return null;
  }

  // Set data in cache with intelligent distribution
  async set<T>(
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTTL,
    tags: string[] = []
  ): Promise<void> {
    const size = this.estimateSize(data);
    
    // Always set in memory if it fits
    if (size <= this.config.maxMemorySize / 10) { // Max 10% of memory for single item
      this.setInMemory(key, data, ttl, tags, size);
    }

    // Set in localStorage for medium-sized items
    if (size <= this.config.maxLocalStorageSize / 5) { // Max 20% of localStorage for single item
      await this.setInLocalStorage(key, data, ttl, tags, size);
    }

    // Set in IndexedDB for larger items or long-term storage
    if (this.config.enableIndexedDB) {
      await this.setInIndexedDB(key, data, ttl, tags, size);
    }
  }

  // Memory cache operations
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setInMemory<T>(
    key: string, 
    data: T, 
    ttl: number, 
    tags: string[] = [], 
    size?: number
  ): void {
    const estimatedSize = size || this.estimateSize(data);
    
    // Check if we need to evict items
    this.evictMemoryIfNeeded(estimatedSize);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: '1.0',
      tags,
      size: estimatedSize,
    };

    this.memoryCache.set(key, entry);
    this.updateStats();
  }

  // localStorage operations
  private async getFromLocalStorage<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(`thinkspace-cache:${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (this.isExpired(entry)) {
        localStorage.removeItem(`thinkspace-cache:${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return null;
    }
  }

  private async setInLocalStorage<T>(
    key: string, 
    data: T, 
    ttl: number, 
    tags: string[] = [], 
    size?: number
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: '1.0',
        tags,
        size: size || this.estimateSize(data),
      };

      const serialized = JSON.stringify(entry);
      
      // Check localStorage quota
      if (serialized.length > this.config.maxLocalStorageSize / 5) {
        return; // Item too large for localStorage
      }

      localStorage.setItem(`thinkspace-cache:${key}`, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Quota exceeded, try to clean up
        this.cleanupLocalStorage();
        try {
          localStorage.setItem(`thinkspace-cache:${key}`, JSON.stringify({
            data,
            timestamp: Date.now(),
            ttl,
            version: '1.0',
            tags,
            size: size || this.estimateSize(data),
          }));
        } catch (retryError) {
          console.warn('Failed to store in localStorage after cleanup:', retryError);
        }
      }
    }
  }

  // IndexedDB operations
  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          const entry: CacheEntry<T> = result;
          
          if (this.isExpired(entry)) {
            // Clean up expired entry
            this.deleteFromIndexedDB(key);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Error reading from IndexedDB:', error);
      return null;
    }
  }

  private async setInIndexedDB<T>(
    key: string, 
    data: T, 
    ttl: number, 
    tags: string[] = [], 
    size?: number
  ): Promise<void> {
    if (!this.db) return;

    try {
      const entry: CacheEntry<T> & { key: string } = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        version: '1.0',
        tags,
        size: size || this.estimateSize(data),
      };

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.put(entry);
    } catch (error) {
      console.warn('Error writing to IndexedDB:', error);
    }
  }

  // Delete operations
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`thinkspace-cache:${key}`);
    }

    await this.deleteFromIndexedDB(key);
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.delete(key);
    } catch (error) {
      console.warn('Error deleting from IndexedDB:', error);
    }
  }

  // Clear cache by tags
  async clearByTags(tags: string[]): Promise<void> {
    // Clear memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('thinkspace-cache:')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              if (entry.tags?.some((tag: string) => tags.includes(tag))) {
                keysToDelete.push(key);
              }
            }
          } catch (error) {
            // Invalid JSON, remove it
            keysToDelete.push(key);
          }
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
    }

    // Clear IndexedDB
    await this.clearIndexedDBByTags(tags);
  }

  private async clearIndexedDBByTags(tags: string[]): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('tags');

      for (const tag of tags) {
        const request = index.openCursor(IDBKeyRange.only(tag));
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      }
    } catch (error) {
      console.warn('Error clearing IndexedDB by tags:', error);
    }
  }

  // Utility methods
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  private evictMemoryIfNeeded(newItemSize: number): void {
    const currentSize = Array.from(this.memoryCache.values())
      .reduce((total, entry) => total + entry.size, 0);

    if (currentSize + newItemSize > this.config.maxMemorySize) {
      // Evict oldest items first
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      let freedSize = 0;
      for (const [key, entry] of entries) {
        this.memoryCache.delete(key);
        freedSize += entry.size;
        
        if (freedSize >= newItemSize) {
          break;
        }
      }
    }
  }

  private cleanupLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const keysToDelete: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('thinkspace-cache:')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const entry = JSON.parse(item);
            if (this.isExpired(entry)) {
              keysToDelete.push(key);
            }
          }
        } catch (error) {
          // Invalid JSON, remove it
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private async cleanup(): Promise<void> {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage
    this.cleanupLocalStorage();

    // Clean IndexedDB
    await this.cleanupIndexedDB();

    this.updateStats();
  }

  private async cleanupIndexedDB(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      
      const cutoff = Date.now() - this.config.defaultTTL;
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (this.isExpired(entry)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.warn('Error cleaning up IndexedDB:', error);
    }
  }

  private updateStats(): void {
    this.stats.entryCount = this.memoryCache.size;
    this.stats.totalSize = Array.from(this.memoryCache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  // Public API methods
  getStats(): CacheStats {
    return { ...this.stats };
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (typeof window !== 'undefined') {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('thinkspace-cache:')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
    }

    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.clear();
    }

    this.updateStats();
  }
}

// Global cache instance
export const cache = new AdvancedCacheManager();

// Convenience functions for common cache operations
export const cacheUtils = {
  // Cache API responses
  cacheApiResponse: async <T>(key: string, apiCall: () => Promise<T>, ttl?: number): Promise<T> => {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await apiCall();
    await cache.set(key, result, ttl, ['api']);
    return result;
  },

  // Cache search results
  cacheSearchResults: async (query: string, results: any[], ttl: number = 10 * 60 * 1000): Promise<void> => {
    const key = `search:${btoa(query)}`;
    await cache.set(key, results, ttl, ['search']);
  },

  // Get cached search results
  getCachedSearchResults: async (query: string): Promise<any[] | null> => {
    const key = `search:${btoa(query)}`;
    return cache.get(key);
  },

  // Cache user preferences
  cacheUserPreferences: async (userId: string, preferences: any): Promise<void> => {
    const key = `preferences:${userId}`;
    await cache.set(key, preferences, 24 * 60 * 60 * 1000, ['preferences']); // 24 hours
  },

  // Invalidate cache by content type
  invalidateByContentType: async (contentType: string): Promise<void> => {
    await cache.clearByTags([contentType, 'api']);
  },

  // Invalidate all search caches
  invalidateSearchCache: async (): Promise<void> => {
    await cache.clearByTags(['search']);
  },
};
