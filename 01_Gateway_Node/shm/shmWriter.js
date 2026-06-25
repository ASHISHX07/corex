import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { safeRead } from "../helpers/fs.helper.js";
import { config } from "../helpers/loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const bridge    = require(path.join(__dirname, '../bridge/build/shm_bridge.node'));
let OFF = null;  // loaded lazily inside initShm()

// ── Buffers & Views ───────────────────────────────────────────────────────────
let ctrlView  = null;   // Int32Array  — controller fields (int32, 4 bytes each)
let indicsDV  = null;   // DataView    — indics buffer
let optionsDV = null;   // DataView    — options buffer

// ── Registry ──────────────────────────────────────────────────────────────────
const indicsSymbolToPos   = new Map();  // index symbol  → indics slot
const optionsSymbolToPos  = new Map();  // option symbol → options slot
// freePositions acts as a LIFO stack — slot layout in SHM is not strike-ordered.
// C++ side must always read the symbol field to identify slot contents.
const freePositions       = [];         // LIFO stack of free option slots.
// const encoder             = new TextEncoder();

const indicsCount  = 1;
const optionsCount = (config.visibility * 2 + 1) * 2;

// ── Init ──────────────────────────────────────────────────────────────────────
function initShm() {
    OFF = JSON.parse(safeRead(path.resolve(__dirname, '../../runtime/shm-offsets.json')));
    
    const ctrlBuf    = bridge.getControllerBuffer();
    const indicsBuf  = bridge.getIndicsDataBuffer(indicsCount * OFF.INDICS.__bytesPerSlot);
    const optionsBuf = bridge.getOptionChainBuffer(optionsCount * OFF.OPTIONS.__bytesPerSlot);
    bridge.getOrderBuffer(OFF.ORDER.__bytesPerSlot); // ← ensures ORDER_MEM segment exists before C++ opens it

    ctrlView  = new Int32Array(ctrlBuf.buffer, ctrlBuf.byteOffset, OFF.CONTROLLER.__bytesPerSlot / 4);
    indicsDV  = new DataView(indicsBuf.buffer, indicsBuf.byteOffset);
    optionsDV = new DataView(optionsBuf.buffer, optionsBuf.byteOffset); 

    // Write controller header
    ctrlView[OFF.CONTROLLER.systemStatus                / 4] = 0;   // not read yet
    ctrlView[OFF.CONTROLLER.IndicesCount                / 4] = indicsCount;
    ctrlView[OFF.CONTROLLER.OptionsCount                / 4] = optionsCount;
    ctrlView[OFF.CONTROLLER.tbtSocketSymbolCount        / 4] = 0;
    ctrlView[OFF.CONTROLLER.apiSymbolCount              / 4] = 0;
    ctrlView[OFF.CONTROLLER.signal                      / 4] = 0;
    ctrlView[OFF.CONTROLLER.action                      / 4] = 0;

    for (let i = 0; i < optionsCount; i++) freePositions.push(i);
    console.log(`[SHM] INITIALIZED - Indics: ${indicsCount}, options: ${optionsCount}`);
}

function setReady() {
    if (!ctrlView) throw new Error('[SHM] setReady called before initShm');
    ctrlView[OFF.CONTROLLER.systemStatus / 4] = 1;
}

// ── applySymbols — called on startup and every ATM shift ──────────────────────
// symbols: string[]  (from buildOptionSymbols)
function applySymbols(symbols) {
    if (!optionsDV) throw new Error('[SHM] applyMap called before initShm');

    const newOptionSyms = new Set(symbols.filter(s => !s.includes('INDEX')));
    const newIndicsSyms = new Set(symbols.filter(s =>  s.includes('INDEX')));

    // Recycle departed option slots
    for (const [sym, pos] of optionsSymbolToPos) {
        if (!newOptionSyms.has(sym)) {
            const base = pos * OFF.OPTIONS.__bytesPerSlot;
            new Uint8Array(optionsDV.buffer, optionsDV.byteOffset + base, OFF.OPTIONS.__bytesPerSlot).fill(0);
            freePositions.push(pos);
            optionsSymbolToPos.delete(sym);
        }
    }

    // Assign slots to new option symbols
    for (const sym of newOptionSyms) {
        if (!optionsSymbolToPos.has(sym)) {
            const pos = freePositions.pop();
            if (pos === undefined) {
                console.error(`[SHM] No free slot for ${sym}`);
                return;
            }
            // Zero the slot before use — prevents stale/garbage memory reads on C++ side
            const base = pos * OFF.OPTIONS.__bytesPerSlot;
            new Uint8Array(optionsDV.buffer, optionsDV.byteOffset + base, OFF.OPTIONS.__bytesPerSlot).fill(0);

            optionsSymbolToPos.set(sym, pos);
            _writeSymbol(sym, pos, false);
        }
    }

    // Assign indics slots (only grows, never shrinks)
    let nextIndicsSlot = indicsSymbolToPos.size;
    for (const sym of newIndicsSyms) {
        if (!indicsSymbolToPos.has(sym)) {
            indicsSymbolToPos.set(sym, nextIndicsSlot);
            _writeSymbol(sym, nextIndicsSlot, true);
            nextIndicsSlot++;
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function _writeSymbol(symbol, pos, isIndex) {
    const dv        = isIndex ? indicsDV : optionsDV;
    const bps       = isIndex ? OFF.INDICS.__bytesPerSlot : OFF.OPTIONS.__bytesPerSlot;
    const symOff    = isIndex ? OFF.INDICS.symbol : OFF.OPTIONS.symbol
    const base      = pos * bps + symOff;

    // Write byte by byte via DataView — avoids any ArrayBuffer slice offset issue
    const encoded   = new TextEncoder().encode(symbol.padEnd(32, '\0').slice(0, 32));
    for (let i = 0; i < 32; i++) {
        dv.setUint8(base + i, encoded[i] ?? 0);
    }
}

// ── onSocketTick — called from optionChain.stream.js ──────────────────────────
function onSocketTick(isIndex, symbol, packet) {
    if (isIndex) _writeIndicsSocket(symbol, packet);
    else         _writeOptionSocket(symbol, packet);
}

// ── onPollData — called from optionApiPolls.stream.js ─────────────────────────
function onPollData(data) {
    if (data.indiavixData) _writeIndicsVix(data.indiavixData);

    if (data.callOi !== undefined || data.putOi !== undefined) {
        const base = 0;
        indicsDV.setFloat64(base + OFF.INDICS.tCallOi, data.callOi ?? 0, true);
        indicsDV.setFloat64(base + OFF.INDICS.tPutOi, data.putOi ?? 0, true);
    }

    for (const row of data.optionsChain) {
        if (row.strike_price === -1) { _writeIndicsFromPoll(row); continue; }
        _writeOptionPoll(row);
    }
}

// ── Internal writers ──────────────────────────────────────────────────────────

function _writeIndicsSocket(symbol, p) {
    const pos = indicsSymbolToPos.get(symbol);
    if (pos === undefined) return;
    const base = pos * OFF.INDICS.__bytesPerSlot;  // instrument 1=NIFTY, 2=BANKNIFTY etc.
    const v    = indicsDV;
    const O    = OFF.INDICS;

    v.setFloat64(base + O.ltp,              p.ltp                ?? 0, true);
    v.setFloat64(base + O.exchFeedTime,     p.exch_feed_time     ?? 0, true);
    v.setFloat64(base + O.high,             p.high_price         ?? 0, true);
    v.setFloat64(base + O.low,              p.low_price          ?? 0, true);
    v.setFloat64(base + O.open,             p.open_price         ?? 0, true);
    v.setFloat64(base + O.prevClose,        p.prev_close_price   ?? 0, true);
    v.setFloat64(base + O.ch,               p.ch                 ?? 0, true);
    v.setFloat64(base + O.chp,              p.chp                ?? 0, true);
}

function _writeIndicsFromPoll(row) {
    const pos = indicsSymbolToPos.get(row.symbol);
    if (pos === undefined) return;
    const base = pos * OFF.INDICS.__bytesPerSlot;
    const v    = indicsDV;
    const O    = OFF.INDICS;

    v.setFloat64(base + O.fp,               row.fp               ?? 0, true);
    v.setFloat64(base + O.fpch,             row.fpch             ?? 0, true);
    v.setFloat64(base + O.fpchp,            row.fpchp            ?? 0, true);
}

function _writeIndicsVix(vix) {
    const base = 0;     // VIX belongs to NIFTY slot (instrument 1), always offset 0
    const v    = indicsDV;
    const O    = OFF.INDICS;

    v.setFloat64(base + O.iVixLtp,          vix.ltp              ?? 0, true);
    v.setFloat64(base + O.iVixCh,           vix.ltpch            ?? 0, true);
    v.setFloat64(base + O.iVixChp,          vix.ltpchp           ?? 0, true);
}

function _writeOptionSocket(symbol, p) {
    const pos = optionsSymbolToPos.get(symbol);
    if (pos === undefined) return;  // not in active window, ignore

    const base = pos * OFF.OPTIONS.__bytesPerSlot;
    const v    = optionsDV;
    const O    = OFF.OPTIONS;

    v.setFloat64(base + O.cp,               (p.symbol.includes('CE') ? 1 : 2) ?? 0, true);
    v.setFloat64(base + O.ltp,              p.ltp                ?? 0, true);
    v.setFloat64(base + O.ch,               p.ch                 ?? 0, true);
    v.setFloat64(base + O.chp,              p.chp                ?? 0, true);
    v.setFloat64(base + O.volume,           p.vol_traded_today   ?? 0, true);
    v.setFloat64(base + O.totBuyQty,        p.tot_buy_qty        ?? 0, true);
    v.setFloat64(base + O.totSellQty,       p.tot_sell_qty       ?? 0, true);
    v.setFloat64(base + O.avgTradePrice,    p.avg_trade_price    ?? 0, true);
    v.setFloat64(base + O.high,             p.high_price         ?? 0, true);
    v.setFloat64(base + O.low,              p.low_price          ?? 0, true);
    v.setFloat64(base + O.open,             p.open_price         ?? 0, true);
    v.setFloat64(base + O.prevClose,        p.prev_close_price   ?? 0, true);
    v.setFloat64(base + O.upperCkt,         p.upper_ckt          ?? 0, true);
    v.setFloat64(base + O.lowerCkt,         p.lower_ckt          ?? 0, true);
    v.setFloat64(base + O.exchFeedTime,     p.exch_feed_time     ?? 0, true);
}

function _writeOptionPoll(row) {
    const pos = optionsSymbolToPos.get(row.symbol);
    if (pos === undefined) return;

    const base = pos * OFF.OPTIONS.__bytesPerSlot;
    const v    = optionsDV;
    const O    = OFF.OPTIONS
    const g    = row.greeks ?? {};

    v.setFloat64(base + O.strike,           row.strike_price     ?? 0, true);
    v.setFloat64(base + O.oi,               row.oi               ?? 0, true);
    v.setFloat64(base + O.chngInOi,         row.oich             ?? 0, true);
    v.setFloat64(base + O.prevOi,           row.prev_oi          ?? 0, true);
    v.setFloat64(base + O.iv,               row.iv               ?? 0, true);
    v.setFloat64(base + O.delta,            g.delta              ?? 0, true);
    v.setFloat64(base + O.theta,            g.theta              ?? 0, true);
    v.setFloat64(base + O.gamma,            g.gamma              ?? 0, true);
    v.setFloat64(base + O.vega,             g.vega               ?? 0, true);
}

function closeProcess() {
    if (!ctrlView) return;
    ctrlView[OFF.CONTROLLER.systemStatus  / 4] = 0;
}

export { initShm, setReady, applySymbols, onSocketTick, onPollData, closeProcess };
