import { Cache } from "./src/index.js";

const cache = new Cache(2);

cache.put("A", 10);
console.log('after put("A", 10):', describe(cache));

cache.put("B", 20);
console.log('after put("B", 20):', describe(cache));

console.log('get("A") =>', cache.get("A"));
console.log("A is now MRU:", describe(cache));

cache.put("C", 30);
console.log('after put("C", 30) — B should be evicted:', describe(cache));

console.log('get("B") =>', cache.get("B"));
console.log('get("C") =>', cache.get("C"));
console.log('get("A") =>', cache.get("A"));

console.log("\n--- TTL bonus demo ---");
let clock = 1_000;
const ttlCache = new Cache(2, { now: () => clock });

ttlCache.put("X", 1, 50); // expires at t=1050
ttlCache.put("Y", 2);
console.log("t=1000 get X =>", ttlCache.get("X"));

clock = 1_060;
console.log("t=1060 get X (expired) =>", ttlCache.get("X"));
console.log("t=1060 get Y =>", ttlCache.get("Y"));

/**
 * Lightweight peek for demo logging (not part of public Cache API).
 * @param {Cache} c
 */
function describe(c) {
  return `{ size: ${c.size()}, keys: [${[...c.map.keys()].join(", ")}] }`;
}
