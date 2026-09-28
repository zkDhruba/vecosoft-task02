import { CacheNode } from "./cache-node.js";

/**
 * Order-tracking structure for LRU (head side = MRU, tail side = LRU).
 * Single responsibility: maintain insertion/removal order in O(1).
 * Does not know about cache capacity or key lookups.
 */
export class DoublyLinkedList {
  constructor() {
    this.head = new CacheNode(Symbol("head"), null);
    this.tail = new CacheNode(Symbol("tail"), null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Insert node immediately after head (most recently used position).
   * @param {CacheNode} node
   */
  addToHead(node) {
    const first = this.head.next;
    node.prev = this.head;
    node.next = first;
    this.head.next = node;
    first.prev = node;
  }

  /**
   * Unlink node from the list without destroying its data.
   * @param {CacheNode} node
   */
  remove(node) {
    const { prev, next } = node;
    prev.next = next;
    next.prev = prev;
    node.prev = null;
    node.next = null;
  }

  /**
   * @param {CacheNode} node
   */
  moveToHead(node) {
    this.remove(node);
    this.addToHead(node);
  }

  /**
   * Remove and return the least recently used real node, or null if empty.
   * @returns {CacheNode|null}
   */
  removeTail() {
    const node = this.tail.prev;
    if (node === this.head) {
      return null;
    }
    this.remove(node);
    return node;
  }

  /**
   * @returns {boolean}
   */
  isEmpty() {
    return this.head.next === this.tail;
  }
}
