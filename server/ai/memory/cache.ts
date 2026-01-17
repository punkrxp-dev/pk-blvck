/**
 * Intelligent Cache System for AI Memory
 *
 * Caches embeddings, contexts, and agent responses to improve performance
 * and reduce API calls. Implements LRU eviction and TTL-based expiration.
 */

import { log } from '../../utils/logger';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;        // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  size: number;       // Approximate memory size
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;      // Approximate memory usage
  hitRate: number;
  missRate: number;
  evictions: number;
  hits: number;
  misses: number;
}

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;     // Maximum number of entries
  private maxMemory: number;   // Maximum memory usage in bytes
  private currentMemory = 0;

  // Statistics
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(
    private name: string,
    options: {
      maxSize?: number;
      maxMemoryMB?: number;
      defaultTTL?: number;
    } = {}
  ) {
    this.maxSize = options.maxSize || 1000;
    this.maxMemory = (options.maxMemoryMB || 50) * 1024 * 1024; // Convert MB to bytes

    log(`Memory cache initialized: ${name} (maxSize: ${this.maxSize}, maxMemory: ${options.maxMemoryMB || 50}MB)`, 'cache', 'info');
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.currentMemory -= entry.size;
      this.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, value: T, options: { ttl?: number; size?: number } = {}): void {
    const ttl = options.ttl || 3600000; // 1 hour default
    const size = options.size || this.estimateSize(value);

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize || this.currentMemory + size > this.maxMemory) {
      this.evictEntries(size);
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size
    };

    // Remove old entry if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.currentMemory -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.currentMemory += size;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemory -= entry.size;
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentMemory = 0;
    log(`Cache ${this.name} cleared`, 'cache', 'info');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    const missRate = total > 0 ? this.misses / total : 0;

    return {
      totalEntries: this.cache.size,
      totalSize: this.currentMemory,
      hitRate,
      missRate,
      evictions: this.evictions,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.currentMemory -= entry.size;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      log(`Cache ${this.name} cleanup: ${cleaned} expired entries removed`, 'cache', 'info');
    }

    return cleaned;
  }

  /**
   * Estimate memory size of a value (rough approximation)
   */
  private estimateSize(value: any): number {
    try {
      const jsonString = JSON.stringify(value);
      return jsonString.length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1024; // Fallback size for non-serializable objects
    }
  }

  /**
   * Evict entries using LRU (Least Recently Used) policy
   */
  private evictEntries(requiredSize: number): void {
    // Sort entries by last accessed time (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let evictedSize = 0;
    let evictedCount = 0;

    for (const [key, entry] of entries) {
      if (this.cache.size <= this.maxSize * 0.8 && // Keep at least 80% capacity
          this.currentMemory + requiredSize - evictedSize <= this.maxMemory) {
        break;
      }

      this.cache.delete(key);
      evictedSize += entry.size;
      evictedCount++;
    }

    if (evictedCount > 0) {
      this.evictions += evictedCount;
      this.currentMemory -= evictedSize;
      log(`Cache ${this.name} eviction: ${evictedCount} entries removed (${(evictedSize / 1024 / 1024).toFixed(2)}MB)`, 'cache', 'info');
    }
  }
}

// Global cache instances
export const embeddingCache = new MemoryCache<number[]>('embeddings', {
  maxSize: 5000,
  maxMemoryMB: 100, // 100MB for embeddings
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
});

export const contextCache = new MemoryCache('contexts', {
  maxSize: 2000,
  maxMemoryMB: 50, // 50MB for contexts
  defaultTTL: 60 * 60 * 1000, // 1 hour
});

export const responseCache = new MemoryCache('responses', {
  maxSize: 1000,
  maxMemoryMB: 25, // 25MB for responses
  defaultTTL: 30 * 60 * 1000, // 30 minutes
});

/**
 * Get comprehensive cache statistics
 */
export function getAllCacheStats() {
  return {
    embeddings: embeddingCache.getStats(),
    contexts: contextCache.getStats(),
    responses: responseCache.getStats(),
  };
}

/**
 * Clean up all expired cache entries
 */
export function cleanupAllCaches(): void {
  embeddingCache.cleanup();
  contextCache.cleanup();
  responseCache.cleanup();
  log('All caches cleaned up', 'cache', 'info');
}

/**
 * Clear all caches (admin function)
 */
export function clearAllCaches(): void {
  embeddingCache.clear();
  contextCache.clear();
  responseCache.clear();
  log('All caches cleared', 'cache', 'info');
}

/**
 * Generate cache key for embeddings
 */
export function generateEmbeddingKey(text: string): string {
  // Simple hash for cache key
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `emb_${Math.abs(hash)}`;
}

/**
 * Generate cache key for contexts
 */
export function generateContextKey(email: string, message: string): string {
  const combined = `${email}:${message}`.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ctx_${Math.abs(hash)}`;
}

/**
 * Generate cache key for responses
 */
export function generateResponseKey(agent: string, input: string): string {
  const combined = `${agent}:${input}`.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `resp_${Math.abs(hash)}`;
}