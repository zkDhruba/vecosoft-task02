# LRU Cache

An **O(1)** Least Recently Used (LRU) cache in JavaScript. Supports `get` / `put` with capacity-based eviction, plus an optional **TTL** (time-to-live) bonus.

## Requirements covered

| Operation | Behavior |
| --- | --- |
| `Cache(capacity)` | Create a cache with a positive integer capacity |
| `get(key)` | Return the value, or `-1` if missing/expired; a hit becomes most recently used |
| `put(key, value)` | Insert or update; if full, evict the least recently used entry |
| `put(key, value, ttlMs)` | *(bonus)* Same as `put`, with expiration after `ttlMs` milliseconds |

## Project layout

```
├── src/
│   ├── cache-node.js          # Cache entry (key, value, links, optional expiry)
│   ├── doubly-linked-list.js  # MRU ↔ LRU order (O(1) splice)
│   ├── cache.js               # Cache contract (get/put)
│   ├── lru-cache.js           # LRU policy / orchestration
│   └── index.js               # Public exports
├── test/
│   └── lru-cache.test.js      # Automated tests
├── demo.js                    # Walkthrough of the problem example + TTL
├── package.json
└── README.md
```

## Data structures used (and why)

Two structures work together:

1. **Hash map (`Map`)** — `key → node` for **O(1)** lookup on `get` / `put`.
2. **Doubly linked list** — tracks access order:
   - Near **head** = most recently used (MRU)
   - Near **tail** = least recently used (LRU)

Why both?

- A map alone can find a key quickly, but cannot tell you which entry is oldest in O(1).
- A linked list alone can maintain order, but finding a middle node by key would be O(n).
- Together: map jumps to the node; list moves / removes that node in O(1) via `prev` / `next` pointers.

Dummy head and tail nodes simplify edge cases (empty list, single node) so insert/remove stay uniform.

```
HEAD ⇄ [MRU] ⇄ … ⇄ [LRU] ⇄ TAIL
         ↑
       Map(key → node)
```

## How LRU ordering is maintained

### `get(key)`

1. Look up the key in the map.
2. If missing (or expired under TTL) → return `-1` (order unchanged on miss).
3. On hit → unlink the node from its current list position and move it to the head (MRU), then return its value.

### `put(key, value)`

1. **Key already present** → update value, move node to head (now MRU). Size does not grow.
2. **New key** → if `size == capacity`, remove the node just before the tail (LRU) from both the list and the map, then insert the new node at the head and register it in the map.

### Example (`capacity = 2`)

| Step | Call | Order (MRU → LRU) | Result |
| --- | --- | --- | --- |
| 1 | `put("A", 10)` | A | — |
| 2 | `put("B", 20)` | B → A | — |
| 3 | `get("A")` | A → B | `10` |
| 4 | `put("C", 30)` | C → A | evicts **B** |
| 5 | `get("B")` | C → A | `-1` |
| 6 | `get("C")` / `get("A")` | as accessed | `30` / `10` |

## Time complexity

| Operation | Average time | Reason |
| --- | --- | --- |
| `get(key)` | **O(1)** | Map lookup + constant-time list move |
| `put(key, value)` | **O(1)** | Map insert/update + constant-time list insert / LRU eviction |

List helpers (`addToHead`, `remove`, `moveToHead`, `removeTail`) are all pointer updates — no scanning.

## Space complexity

**O(capacity)** — at most `capacity` entries in the map and the same number of real nodes in the list (plus two dummy sentinel nodes).

No extra structures grow with the number of operations beyond that bound.

## Bonus: TTL / expiration

### Approach

TTL is implemented as **lazy expiration** on top of the same Map + doubly linked list design:

1. Each node may store an optional `expiresAt` timestamp (`null` = never expires).
2. `put(key, value, ttlMs)` sets `expiresAt = now + ttlMs` when `ttlMs` is provided.
3. On `get` / `put`, if the entry exists but `now >= expiresAt`, it is removed from both the map and the list and treated as a miss (`-1` for `get`).
4. During capacity eviction, expired nodes near the LRU end are cleaned up first so a dead entry does not waste a slot forever.
5. A injectable `now` clock (`new Cache(capacity, { now: () => … })`) keeps demos and tests deterministic without real `sleep`.

No background timer or secondary heap is used — expiry is checked only when an entry is touched or space is needed.

### Trade-offs

| Choice | Upside | Downside |
| --- | --- | --- |
| **Lazy expiration** | Keeps `get` / `put` **O(1)** on average; no timer threads; simple to reason about | An expired key that is never accessed again can sit until eviction / another write needs capacity |
| **No expiry min-heap / timer wheel** | No extra **O(log n)** structures; API stays small | Cannot proactively free memory the instant TTL elapses |
| **Injectable `now`** | Deterministic tests and demos | Callers that need wall-clock TTL just use the default `Date.now` |

For this assignment, lazy expiry is enough: correctness on access is guaranteed, and complexity stays aligned with the O(1) LRU requirement.

### Demo output

Run `node demo.js` (or `npm run demo`). TTL section from the script:

```js
let clock = 1_000;
const ttlCache = new Cache(2, { now: () => clock });

ttlCache.put("X", 1, 50); // expires at t = 1050
ttlCache.put("Y", 2);

console.log("t=1000 get X =>", ttlCache.get("X")); // still valid

clock = 1_060;
console.log("t=1060 get X (expired) =>", ttlCache.get("X"));
console.log("t=1060 get Y =>", ttlCache.get("Y"));
```

Actual console output:

```text
--- TTL bonus demo ---
t=1000 get X => 1
t=1060 get X (expired) => -1
t=1060 get Y => 2
```

At `t=1000`, `X` is still within its 50ms TTL. After advancing the clock past `1050`, `get("X")` returns `-1` (expired and removed), while non-TTL key `Y` remains available.

## How to run

Requires **Node.js 18+** (ES modules + built-in test runner). No npm dependencies.

```bash
# From the repo root
node demo.js          # problem example + TTL demo
npm run demo          # same via package script

node --test test/lru-cache.test.js
npm test              # same via package script
```

### Quick usage

```js
import { Cache } from "./src/index.js";

const cache = new Cache(2);
cache.put("A", 10);
cache.put("B", 20);
cache.get("A");       // 10 — A is now MRU
cache.put("C", 30);   // evicts B
cache.get("B");       // -1

// Optional TTL (milliseconds)
cache.put("X", 1, 1000);
```

## Design notes (SOLID)

- **Single responsibility** — node, list, and cache policy live in separate modules.
- **Open/closed** — TTL is an optional `put` argument; core `get`/`put` stay intact.
- **Interface segregation** — public surface is the minimal cache contract (`get` / `put`).
- **Dependency inversion** — `now` (and optionally the list) can be injected for tests / deterministic TTL.
