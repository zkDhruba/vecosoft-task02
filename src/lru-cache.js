import { CacheNode } from "./cache-node.js";
import { DoublyLinkedList } from "./doubly-linked-list.js";

/**
 * Least Recently Used cache with O(1) average get/put.
 *
 * SOLID mapping:
 * - S: policy/orchestration only; order lives in DoublyLinkedList, entries in CacheNode
 * - O: optional TTL via put(..., ttlMs) without changing the core API
 * - L/I: honors the Cache get/put contract
 * - D: depends on list + Map collaborators rather than owning low-level link logic
 */
export class Cache {
  /**
   * @param {number} capacity - must be a positive integer
   * @param {{ list?: DoublyLinkedList, now?: () => number }} [deps]
   *        Optional collaborators (Dependency Inversion / testability).
   */
  constructor(capacity, deps = {}) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError("capacity must be a positive integer");
    }

    this.capacity = capacity;
    /** @type {Map<string|number, CacheNode>} */
    this.map = new Map();
    this.list = deps.list ?? new DoublyLinkedList();
    this.now = deps.now ?? Date.now;
  }

  /**
   * @param {string|number} key
   * @returns {*| -1}
   */
  get(key) {
    const node = this.map.get(key);
    if (!node) {
      return -1;
    }

    if (this.#evictIfExpired(node)) {
      return -1;
    }

    this.list.moveToHead(node);
    return node.value;
  }

  /**
   * @param {string|number} key
   * @param {*} value
   * @param {number|null} [ttlMs=null] - optional lifetime in milliseconds
   */
  put(key, value, ttlMs = null) {
    const expiresAt = this.#toExpiresAt(ttlMs);
    const existing = this.map.get(key);

    if (existing) {
      if (existing.isExpired(this.now())) {
        this.#removeEntry(existing);
      } else {
        existing.value = value;
        existing.expiresAt = expiresAt;
        this.list.moveToHead(existing);
        return;
      }
    }

    if (this.map.size >= this.capacity) {
      this.#evictLeastRecentlyUsed();
    }

    const node = new CacheNode(key, value, expiresAt);
    this.list.addToHead(node);
    this.map.set(key, node);
  }

  /**
   * Current live entry count (expired-but-not-yet-touched entries may still count).
   * @returns {number}
   */
  size() {
    return this.map.size;
  }

  /**
   * @param {number|null} ttlMs
   * @returns {number|null}
   */
  #toExpiresAt(ttlMs) {
    if (ttlMs == null) {
      return null;
    }
    if (!Number.isFinite(ttlMs) || ttlMs < 0) {
      throw new RangeError("ttlMs must be a non-negative finite number");
    }
    return this.now() + ttlMs;
  }

  /**
   * @param {CacheNode} node
   * @returns {boolean} true if the node was removed because it expired
   */
  #evictIfExpired(node) {
    if (!node.isExpired(this.now())) {
      return false;
    }
    this.#removeEntry(node);
    return true;
  }

  #evictLeastRecentlyUsed() {
    // Skip expired nodes at the LRU end first (lazy cleanup).
    while (!this.list.isEmpty()) {
      const lru = this.list.removeTail();
      if (!lru) {
        return;
      }
      this.map.delete(lru.key);
      if (!lru.isExpired(this.now())) {
        return;
      }
    }
  }

  /**
   * @param {CacheNode} node
   */
  #removeEntry(node) {
    if (this.map.get(node.key) === node) {
      this.map.delete(node.key);
    }
    if (node.prev && node.next) {
      this.list.remove(node);
    }
  }
}
