/**
 * Minimal cache contract (Interface Segregation).
 * Implementations must honor get/put semantics; storage strategy can vary.
 *
 * @typedef {object} Cache
 * @property {(key: string|number) => *} get
 * @property {(key: string|number, value: *, ttlMs?: number|null) => void} put
 */

/**
 * Ensures a value satisfies the Cache contract at runtime.
 * @param {object} candidate
 * @returns {asserts candidate is Cache}
 */
export function assertCacheContract(candidate) {
  if (
    typeof candidate?.get !== "function" ||
    typeof candidate?.put !== "function"
  ) {
    throw new TypeError("Object does not satisfy Cache contract (get/put required)");
  }
}
