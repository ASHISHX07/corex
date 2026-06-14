# CoreX SHM Layer — Technical Documentation

> **Scope:** `01_Gateway_Node/shm/shmWriter.js` and `01_Gateway_Node/shm/shmReader.js`
> **Purpose:** Explains the shared memory architecture, every function, and the full data flow between the Node.js Gateway and the C++ Execution Core.

***

## Overview

The SHM (Shared Memory) layer is the communication backbone between the two processes in CoreX:

| Process | Role |
|---|---|
| **Node.js Gateway** (`01_Gateway_Node`) | Connects to Fyers APIs (WebSocket + REST), writes live market data into shared memory |
| **C++ Core** (`03_Core_Cpp`) | Reads market data from shared memory, runs strategies, writes order signals back into shared memory |

Node and C++ never talk over a socket or pipe. They communicate by reading and writing the **same physical memory pages** — Boost.Interprocess named shared memory segments on Linux. This is zero-copy and the fastest possible IPC mechanism.

The SHM layer in Node consists of two files with distinct responsibilities:

- **`shmWriter.js`** — owns the market data flow. Writes index ticks, option ticks, OI, and Greeks into SHM.
- **`shmReader.js`** — owns the signal/order flow. Polls SHM every 50ms and reacts to signals written by C++.

***

## Shared Memory Segments

Four named segments exist in SHM, each created by `shmWriter.js` at startup:

| Segment Name | Buffer Owner | Size | Contents |
|---|---|---|---|
| `CONTROLLER` | `shmWriter` | 28 bytes (fixed) | System status, counts, signal/action handshake |
| `INDICES_DATA_MEM` | `shmWriter` | `indicesCount × 136` bytes | Live index data (NIFTY, BANKNIFTY, etc.) |
| `OPTIONS_DATA_MEM` | `shmWriter` | `optionsCount × 208` bytes | Live option chain data for active ATM window |
| `ORDER_MEM` | `shmReader` (init) / `shmWriter` (pre-create) | 352 bytes (fixed) | Single pending order from C++ to Node |

All byte offsets are driven by `shm-offsets.json` — no position is hardcoded in JS.

***

## The Bridge (`shm_bridge.node`)

The native C++ addon compiled at `01_Gateway_Node/bridge/build/shm_bridge.node` is loaded with `require()` and exposes five functions:

```
bridge.getControllerBuffer()            → Buffer (28 bytes)
bridge.getIndicsDataBuffer(size)        → Buffer (size bytes)
bridge.getOptionChainBuffer(size)       → Buffer (size bytes)
bridge.getTbtDepthBuffer(size)          → Buffer (size bytes)
bridge.getOrderBuffer(size)             → Buffer (size bytes)
```

Each function does `open_or_create` on its named SHM segment and returns a Node.js `Buffer` whose underlying memory **is** the shared memory page — no copy is involved. Writing to this `Buffer` is writing directly to memory that C++ reads.

***

## `shmWriter.js`

### Module-Level State

```js
const bridge = require('../bridge/build/shm_bridge.node');
const OFF    = JSON.parse(safeRead('...shm-offsets.json'));
```

- `bridge` — the native addon; all SHM segment operations go through it
- `OFF` — the parsed offsets file; every field byte position comes from here (e.g. `OFF.INDICS.ltp === 16`)

```js
const instrumentToPos    = new Map();  // instrument number → SHM slot index
const symbolToInstrument = new Map();  // Fyers symbol string → instrument number
const freePositions      = [];         // available slot indices, used as LIFO stack
```

These three structures form the **slot registry** — the live map of which option instrument is stored in which slot of `OPTIONS_DATA_MEM` at any given moment.

```js
const indicesCount = config.INDICS?.length ?? 1;
const optionsCount = (config.visibility * 2 + 1) * 2;
```

- `indicesCount` — how many index buffers to allocate (e.g. 4 for NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY)
- `optionsCount` — total option slots: `visibility` strikes above and below ATM × 2 (CE + PE). With `visibility = 5`: `(5×2 + 1) × 2 = 22` slots

***

### `initShm()`

Called **once at startup**. Creates all SHM segments and initialises the controller header.

**Step 1 — Open/create SHM segments via the bridge:**

```js
const ctrlBuf    = bridge.getControllerBuffer();
const indicsBuf  = bridge.getIndicsDataBuffer(indicesCount * OFF.INDICS.__bytesPerSlot);
const optionsBuf = bridge.getOptionChainBuffer(optionsCount * OFF.OPTIONS.__bytesPerSlot);
bridge.getOrderBuffer(OFF.ORDER.__bytesPerSlot);  // pre-create so C++ can open it immediately
```

The ORDER buffer is created here but no `DataView` is kept — the writer never reads or writes order fields. Its only job is to ensure the `ORDER_MEM` segment exists on the OS before C++ tries to open it.

**Step 2 — Wrap buffers in typed views:**

```js
ctrlView  = new Int32Array(ctrlBuf.buffer, ctrlBuf.byteOffset, OFF.CONTROLLER.__bytesPerSlot / 4);
indicsDV  = new DataView(indicsBuf.buffer, indicsBuf.byteOffset);
optionsDV = new DataView(optionsBuf.buffer, optionsBuf.byteOffset);
```

- `Int32Array` for the controller — all fields are `int32` (4 bytes). Index by `offset / 4` to convert byte offset to array index.
- `DataView` for indics and options — fields are `float64` (8 bytes). `DataView.setFloat64(byteOffset, value, true)` writes with explicit little-endian ordering.

**Step 3 — Write the controller header:**

```js
ctrlView[OFF.CONTROLLER.systemStatus  / 4] = 0;  // 0 = not ready
ctrlView[OFF.CONTROLLER.IndicesCount  / 4] = indicesCount;
ctrlView[OFF.CONTROLLER.OptionsCount  / 4] = optionsCount;
ctrlView[OFF.CONTROLLER.tbtSocketSymbolCount / 4] = 0;
ctrlView[OFF.CONTROLLER.apiSymbolCount / 4] = 0;
ctrlView[OFF.CONTROLLER.signal / 4] = 0;
ctrlView[OFF.CONTROLLER.action / 4] = 0;
```

C++ reads `IndicesCount` and `OptionsCount` on startup to know the dimensions of each buffer. `systemStatus = 0` tells C++ not to consume data yet — data hasn't started flowing.

**Step 4 — Pre-fill `freePositions`:**

```js
for (let i = 0; i < optionsCount; i++) freePositions.push(i);
// result: [0, 1, 2, ... 21]  (for optionsCount = 22)
```

All option slots start as available. Slots are claimed with `.pop()` (LIFO) and recycled back with `.push()` when an option leaves the ATM window.

***

### `setReady()`

```js
ctrlView[OFF.CONTROLLER.systemStatus / 4] = 1;
```

Called by `index.js` after all streams are live and the first real tick has arrived. Setting `systemStatus = 1` is the green light — C++ begins consuming market data from SHM only after this point, preventing reads of uninitialised slots.

***

### `applyMap(map)`

Called at startup and **every time the ATM shifts** (NIFTY/BANKNIFTY moves enough that the active option window changes).

The `map` argument is `Map<instrument_number, symbol_string>` produced by the option symbol builder.

**Step 1 — Rebuild `symbolToInstrument`:**

```js
symbolToInstrument.clear();
for (const [instrument, symbol] of map) {
    symbolToInstrument.set(symbol, instrument);
    if (instrument >= 10) newInstruments.add(instrument);
}
```

Index instruments are numbered 1–4 (fixed slots, no registry needed). Option instruments are ≥ 10. Only options are tracked in `instrumentToPos`.

**Step 2 — Recycle positions of instruments leaving the window:**

```js
for (const [instrument, pos] of instrumentToPos) {
    if (!newInstruments.has(instrument)) {
        instrumentToPos.delete(instrument);
        freePositions.push(pos);   // slot is available again
    }
}
```

When ATM shifts, far-OTM strikes rotate out. Their previously assigned SHM slots are returned to the free pool. The data in those slots becomes stale but C++ won't reference them — it always reads the `instrument` field to identify a slot's contents.

**Step 3 — Assign new slots and stamp instrument number:**

```js
for (const instrument of newInstruments) {
    if (!instrumentToPos.has(instrument)) {
        const pos = freePositions.pop();
        instrumentToPos.set(instrument, pos);
        const base = pos * OFF.OPTIONS.__bytesPerSlot;
        optionsDV.setFloat64(base + OFF.OPTIONS.instrument, instrument, true);
    }
}
```

Newly entered strikes get a slot from the free pool. The `instrument` number is immediately stamped into SHM at the `instrument` field offset. This allows C++ to identify the slot's contents without any out-of-band mapping.

***

### `onSocketTick(isIndex, instrument, packet)`

Entry point called by `optionChain.stream.js` on every Fyers WebSocket price tick.

```js
if (isIndex) _writeIndicsSocket(instrument, packet);
else         _writeOptionSocket(instrument, packet);
```

Dispatches to the appropriate internal writer based on whether the tick is for an index or an option.

***

### `_writeIndicsSocket(instrument, p)`

Writes real-time price fields for an index into `INDICES_DATA_MEM`.

```js
const base = (instrument - 1) * OFF.INDICS.__bytesPerSlot;
```

Instruments are 1-indexed (NIFTY = 1, BANKNIFTY = 2, …). Slots are 0-indexed. The `- 1` aligns them.

Fields written: `instrument`, `ltp`, `exchFeedTime`, `high`, `low`, `open`, `prevClose`, `ch`, `chp`.

***

### `_writeOptionSocket(instrument, p)`

Writes real-time price fields for an option into its assigned slot in `OPTIONS_DATA_MEM`.

```js
const pos = instrumentToPos.get(instrument);
if (pos === undefined) return;   // outside ATM window — tick silently dropped
const base = pos * OFF.OPTIONS.__bytesPerSlot;
```

If the instrument isn't in the current ATM window (no slot assigned), the tick is dropped with no error. This happens normally when a fast price move causes a tick to arrive just before `applyMap` assigns the new slot.

Fields written: `instrument`, `ltp`, `ch`, `chp`, `volume`, `totBuyQty`, `totSellQty`, `avgTradePrice`, `high`, `low`, `open`, `prevClose`, `upperCkt`, `lowerCkt`, `exchFeedTime`.

***

### `onPollData(data)`

Entry point called by `optionApiPolls.stream.js` every few seconds when REST API poll data arrives.

The poll response carries data not available on the WebSocket stream: futures price, OI, change in OI, and option Greeks.

```js
if (data.indiavixData) _writeIndicsVix(data.indiavixData);
for (const row of data.optionsChain) {
    if (row.strike_price === -1) _writeIndicsFromPoll(row);   // sentinel row = index data
    else                         _writeOptionPoll(row);
}
```

The option chain API response encodes the underlying index row as `strike_price === -1` — a sentinel value distinguishing it from actual option strikes.

***

### `_writeIndicsFromPoll(row)`

Writes futures price fields (`fp`, `fpch`, `fpchp`) into the index slot. Uses `symbolToInstrument` to find the correct slot:

```js
const instrument = symbolToInstrument.get(row.symbol);
if (instrument === undefined) return;
const base = (instrument - 1) * OFF.INDICS.__bytesPerSlot;
```

***

### `_writeIndicsVix(vix)`

Writes India VIX data always into instrument 1's slot (NIFTY) at `base = 0`, since VIX is only meaningful relative to NIFTY:

```js
const base = 0;   // instrument 1 = NIFTY, slot 0
v.setFloat64(base + O.iVixLtp, vix.ltp, true);
```

***

### `_writeOptionPoll(row)`

Writes OI and Greeks into an option's slot. Requires two lookups:

```js
const instrument = symbolToInstrument.get(row.symbol);
const pos        = instrumentToPos.get(instrument);
```

Fields written: `oi`, `chngInOi`, `prevOi`, `delta`, `theta`, `gamma`, `vega`.

These are not available on the WebSocket so they always come from the poll path.

***

## `shmReader.js`

### Module-Level State

```js
let ctrlView  = null;   // Int32Array — controller (same buffer as writer)
let indicsDV  = null;   // DataView — indics buffer
let optionsDV = null;   // DataView — options buffer
let orderDV   = null;   // DataView — order block (new)

let lastCtrlSignal = 0;
const lastIndicsSignal = new Int32Array(indicesCount);
const lastOptionSignal = new Int32Array(optionsCount);
```

The `last*Signal` arrays are **dedup trackers**. Without them, every 50ms poll tick would re-fire the same signal that C++ wrote once. They store the last seen signal value per slot — a new value is only acted on when it differs from the last seen value.

```js
let _onOrder = null;
function setOrderHandler(fn) { _onOrder = fn; }
```

A single callback slot. `orderManager.js` registers itself here once at startup. When `_checkOrder()` detects an order, it calls `_onOrder(orderData, doneCb)`.

***

### `initReader()`

Opens the same four SHM segments as `shmWriter.js`. Because Boost.Interprocess `open_or_create` is idempotent, both processes can call this safely — whoever calls first creates the segment, the second call just opens it.

```js
const orderBuf = bridge.getOrderBuffer(OFF.ORDER.__bytesPerSlot);
orderDV = new DataView(orderBuf.buffer, orderBuf.byteOffset);
```

This is the key addition over the previous version — the ORDER buffer is now fully wrapped in a `DataView` for field-level access.

***

### `startSignalWatch(intervalMs = 50)`

```js
setInterval(() => {
    _checkController();
    _checkIndics();
    _checkOptions();
    _checkOrder();
}, intervalMs);
```

A single 50ms timer drives all four checks in sequence. 50ms gives a maximum order pickup latency of ~50ms, which is well within acceptable bounds given that the Fyers multi-order API itself has a 100–300ms round-trip time.

***

### `_checkController()`

```js
const signal = ctrlView[OFF.CONTROLLER.signal / 4];
if (signal !== 0 && signal !== lastCtrlSignal) {
    lastCtrlSignal = signal;
    ctrlView[OFF.CONTROLLER.action / 4] = signal;
}
```

C++ writes a non-zero value to `signal` for system-level events (strategy activation, shutdown request). Node detects the change and echoes it into `action`. C++ polls `action` to confirm Node acknowledged the signal. The `!== lastCtrlSignal` guard prevents re-firing on an unchanged value.

***

### `_checkIndics()` and `_checkOptions()`

Same pattern — iterate all slots, read the `signal` field, compare against `lastSignal[i]`, write back into `action` if changed.

C++ uses these to notify Node when a strategy fires on a specific instrument. Currently they log and ack — the full strategy handler will be wired here later.

***

### `_checkOrder()`

The most important new function. Runs every 50ms.

**Step 1 — Poll the status field:**

```js
const status = orderDV.getFloat64(O.status, true);
if (status !== 1) return;
```

`status = 0` is the idle state (returns immediately, almost always). `status = 1` means C++ has written a complete order and is waiting for Node to pick it up.

**Step 2 — Ack before reading:**

```js
orderDV.setFloat64(O.status, 2, true);
```

Status is set to `2` ("picked up") **before** reading the leg data. This is intentional: reading the legs and dispatching takes measurable time. Acking first prevents C++ from thinking the order was missed and timing out.

**Step 3 — Read the order:**

```js
const count      = orderDV.getFloat64(O.count, true);
const strategyId = orderDV.getFloat64(O.strategyId, true);
const timestamp  = orderDV.getFloat64(O.timestamp, true);
```

**Step 4 — Read all legs (up to `__maxLegs = 5`):**

```js
for (let i = 0; i < count && i < O.__maxLegs; i++) {
    legs.push({
        instrument: orderDV.getFloat64(O[`leg${i}_instrument`], true),
        side:       orderDV.getFloat64(O[`leg${i}_side`],       true),  // 1 = BUY, -1 = SELL
        orderType:  orderDV.getFloat64(O[`leg${i}_orderType`],  true),  // 1 = MARKET, 2 = LIMIT
        qty:        orderDV.getFloat64(O[`leg${i}_qty`],        true),
        limitPrice: orderDV.getFloat64(O[`leg${i}_limitPrice`], true),
        stopPrice:  orderDV.getFloat64(O[`leg${i}_stopPrice`],  true),
        slPrice:    orderDV.getFloat64(O[`leg${i}_slPrice`],    true),
        takeProfit: orderDV.getFloat64(O[`leg${i}_takeProfit`], true),
    });
}
```

`O[`leg${i}_instrument`]` resolves to `OFF.ORDER.leg0_instrument` which is the number `32` (byte offset). The `__maxLegs` guard prevents reading past the buffer even if C++ writes a malformed `count`.

**Step 5 — Hand off to `orderManager` with a done callback:**

```js
if (_onOrder) {
    _onOrder({ strategyId, timestamp, legs }, (result) => {
        orderDV.setFloat64(O.status, result === 'ok' ? 3 : -1, true);
    });
}
```

`orderManager.js` receives the order and the `done` callback. After it gets a response from the Fyers API, it calls `done('ok')` or `done('fail')`. The callback writes the final status (`3` or `-1`) back into SHM. C++ polls this value and resets `status` to `0` when it sees a terminal value, making the block available for the next order.

***

## Status State Machine for ORDER_MEM

```
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  ▼                                                     │
  0 (idle)                                              │
  │                                                     │
  │  C++ writes order + sets status = 1                 │
  ▼                                                     │
  1 (pending)                                           │
  │                                                     │
  │  Node detects 1 → immediately sets status = 2       │
  ▼                                                     │
  2 (picked up)                                         │
  │                                                     │
  │  Node sends to Fyers API                            │
  │  → success: done('ok')  → sets status = 3           │
  │  → failure: done('fail') → sets status = -1         │
  ▼                         ▼                           │
  3 (confirmed)         -1 (failed)                     │
  │                         │                           │
  └─────────────────────────┘                           │
  C++ reads terminal status → resets status = 0 ────────┘
```

***

## Full Data Flow

```
 MARKET DATA SOURCES
 ┌──────────────────────────────────────────┐
 │  Fyers WebSocket (price ticks)           │
 │  Fyers REST API  (OI, Greeks, futures)   │
 └──────────────────┬───────────────────────┘
                    │
         optionChain.stream.js
         optionApiPolls.stream.js
                    │ onSocketTick() / onPollData()
                    ▼
             shmWriter.js
         ┌───────────────────────┐
         │  _writeIndicsSocket   │──→  INDICES_DATA_MEM
         │  _writeOptionSocket   │──→  OPTIONS_DATA_MEM
         │  _writeIndicsFromPoll │──→  INDICES_DATA_MEM
         │  _writeOptionPoll     │──→  OPTIONS_DATA_MEM
         │  _writeIndicsVix      │──→  INDICES_DATA_MEM
         └───────────────────────┘
                                         ↑ reads
                                    C++ Execution Core
                                    runs strategy logic
                                    writes ORDER_MEM
                                    sets status = 1
                                         ↓ writes
             shmReader.js
         ┌───────────────────────┐
         │  _checkOrder()        │←── ORDER_MEM (status = 1)
         │  → ack (status = 2)   │
         │  → read legs          │
         │  → call _onOrder()    │
         └──────────┬────────────┘
                    │
             orderManager.js (TODO)
             → map instrument → Fyers symbol
             → POST /multi-order/sync
             → call done('ok'/'fail')
                    │
             shmReader.js callback
             → write status = 3 or -1
                    │
             C++ resets status = 0
```

***

## SHM Offset Reference (from `shm-offsets.json`)

### CONTROLLER (28 bytes total)

| Field | Byte Offset | Type | Notes |
|---|---|---|---|
| `systemStatus` | 0 | int32 | 0 = not ready, 1 = active |
| `IndicesCount` | 4 | int32 | Number of index slots |
| `OptionsCount` | 8 | int32 | Number of option slots |
| `tbtSocketSymbolCount` | 12 | int32 | Active TBT socket symbols |
| `apiSymbolCount` | 16 | int32 | Active API symbols |
| `signal` | 20 | int32 | C++ → Node system signal |
| `action` | 24 | int32 | Node → C++ ack of signal |

### ORDER (352 bytes, 5 legs max)

| Field | Byte Offset | Type | Notes |
|---|---|---|---|
| `count` | 0 | float64 | Number of legs (1–5) |
| `strategyId` | 8 | float64 | Strategy identifier |
| `timestamp` | 16 | float64 | Unix timestamp from C++ |
| `status` | 24 | float64 | State machine value (0/1/2/3/-1) |
| `leg0_instrument` | 32 | float64 | Instrument number for leg 0 |
| `leg0_side` | 40 | float64 | 1 = BUY, -1 = SELL |
| `leg0_orderType` | 48 | float64 | 1 = MARKET, 2 = LIMIT |
| `leg0_qty` | 56 | float64 | Quantity |
| `leg0_limitPrice` | 64 | float64 | Limit price (0 if MARKET) |
| `leg0_stopPrice` | 72 | float64 | Stop price |
| `leg0_slPrice` | 80 | float64 | Stop-loss price |
| `leg0_takeProfit` | 88 | float64 | Take-profit price |
| *(leg1 through leg4 follow at +64 byte intervals)* | 96–344 | float64 | Same 8 fields per leg |

***

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Flat struct, no pointers** | SHM has no shared virtual address space — all offsets must be relative to the segment base |
| **All fields as `float64`** | Uniform type simplifies both JS (`DataView.setFloat64`) and C++ (`double`) layout with no padding surprises |
| **LIFO slot assignment** | Slot layout in SHM is not strike-ordered — C++ always reads the `instrument` field to identify slot contents |
| **`status = 2` acked before reading** | Prevents C++ timeout while Node is processing the order |
| **50ms poll interval** | Fast enough for order pickup (<50ms latency), low enough CPU overhead; Fyers API RTT itself is 100–300ms |
| **`__maxLegs` guard in reader** | Prevents buffer overread if C++ writes a malformed `count` |
| **Writer pre-creates ORDER_MEM** | Ensures the segment exists on the OS before C++ tries to `open_or_create` it |