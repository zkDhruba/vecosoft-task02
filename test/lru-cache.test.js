import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Cache, assertCacheContract } from "../src/index.js";

describe("Cache (LRU)", () => {
  it("follows the problem example", () => {
    const cache = new Cache(2);

    cache.put("A", 10);
    cache.put("B", 20);
    assert.equal(cache.get("A"), 10);

    cache.put("C", 30);
    assert.equal(cache.get("B"), -1);
    assert.equal(cache.get("C"), 30);
    assert.equal(cache.get("A"), 10);
  });

  it("rejects non-positive capacity", () => {
    assert.throws(() => new Cache(0), RangeError);
    assert.throws(() => new Cache(-1), RangeError);
    assert.throws(() => new Cache(1.5), RangeError);
  });

  it("updates existing key without growing size and marks it MRU", () => {
    const cache = new Cache(2);
    cache.put("A", 1);
    cache.put("B", 2);
    cache.put("A", 100);

    assert.equal(cache.size(), 2);
    assert.equal(cache.get("A"), 100);

    cache.put("C", 3);
    assert.equal(cache.get("B"), -1);
    assert.equal(cache.get("A"), 100);
    assert.equal(cache.get("C"), 3);
  });

  it("handles capacity of 1", () => {
    const cache = new Cache(1);
    cache.put("A", 1);
    cache.put("B", 2);
    assert.equal(cache.get("A"), -1);
    assert.equal(cache.get("B"), 2);
  });

  it("satisfies the Cache contract", () => {
    assertCacheContract(new Cache(1));
  });

  it("supports TTL / expiration (bonus)", () => {
    let clock = 0;
    const cache = new Cache(2, { now: () => clock });

    cache.put("A", 10, 100);
    cache.put("B", 20);

    clock = 50;
    assert.equal(cache.get("A"), 10);

    clock = 100;
    assert.equal(cache.get("A"), -1);
    assert.equal(cache.get("B"), 20);
  });
});
