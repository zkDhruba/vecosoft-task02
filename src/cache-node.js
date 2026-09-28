/**
 * Doubly linked list node that stores one cache entry.
 * Single responsibility: hold key/value and neighbor links.
 */
export class CacheNode {
  /**
   * @param {string|number} key
   * @param {*} value
   * @param {number|null} [expiresAt=null] - epoch ms; null means no expiry
   */
  constructor(key, value, expiresAt = null) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    /** @type {CacheNode|null} */
    this.prev = null;
    /** @type {CacheNode|null} */
    this.next = null;
  }

  /**
   * @param {number} [now=Date.now()]
   * @returns {boolean}
   */
  isExpired(now = Date.now()) {
    return this.expiresAt !== null && now >= this.expiresAt;
  }
}
