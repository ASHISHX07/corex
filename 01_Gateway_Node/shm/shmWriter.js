import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { safeRead } from "../helpers/fs.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const bridge    = require(path.join(__dirname, '../bridge/build/shm_bridge.node'));
const OFF       = JSON.parse(safeRead(path.resolve(__dirname, '../../runtime/shm-offsets.json')));

// ── Buffers & Views ───────────────────────────────────────────────────────────
let ctrlView  = null;   // Int32Array  — controller fields (int32, 4 bytes each)
let indicsDV  = null;   // DataView    — indics buffer
let optionsDV = null;   // DataView    — options buffer

// ── Registry ──────────────────────────────────────────────────────────────────
const instrumentToPos = new Map();
// symbol string → instrument number  (mirror of reverseMap, set via applyMap)
const symbolToInstrument = new Map();
const freePositions    = [];
let totalOptionSlots   = 0;

// ── Init ──────────────────────────────────────────────────────────────────────
function initShm(indicesCount, optionsCount) {
    totalOptionSlots = optionsCount;

    const ctrlBuf    = bridge.getControllerBuffer();
    const indicsBuf  = bridge.getIndicsDataBuffer(indicesCount * OFF.INDICS.__bytesPerSlot);
    const optionsBuf = bridge.getOptionChainBuffer(optionsCount * OFF.OPTIONS.__bytesPerSlot);

    ctrlView  = new Int32Array(ctrlBuf.buffer, ctrlBuf.byteOffset, OFF.CONTROLLER.__bytesPerSlot / 4);
    indicsDV  = new DataView(indicsBuf.buffer, indicsBuf.byteOffset);
    optionsDV = new DataView(optionsBuf.buffer, optionsBuf.byteOffset); 

    // Write controller header
    ctrlView[OFF.CONTROLLER.systemStatus                / 4] = 0;   // not read yet
    ctrlView[OFF.CONTROLLER.IndicesCount                / 4] = indicesCount;
    ctrlView[OFF.CONTROLLER.OptionsCount                / 4] = optionsCount;
    ctrlView[OFF.CONTROLLER.tbtSocketSymbolCount        / 4] = 0;
    ctrlView[OFF.CONTROLLER.apiSymbolCount              / 4] = 0;
    ctrlView[OFF.CONTROLLER.signal                      / 4] = 0;
    ctrlView[OFF.CONTROLLER.action                      / 4] = 0;

    for (let i = 0; i < optionsCount; i++) freePositions.push(i);
    console.log(`[SHM] INITIALIZED - Indics: ${indicesCount}, options: ${optionsCount}`);
}

function setReady() {
    if (ctrlView) ctrlView[OFF.CONTROLLER.systemStatus / 4] = 1;
}

// ── applyMap — called on startup and every ATM shift ──────────────────────────
// map: Map<instrument, symbol>  (from buildOptionSymbols)
function applyMap(map) {
    const newInstruments = new Set();

    // Rebuild symbolToInstrument from fresh map
    symbolToInstrument.clear();
    for (const [instrument, symbol] of map) {
        symbolToInstrument.set(symbol, instrument);
        if (instrument >= 10) newInstruments.add(instrument);
    }

    // Find instruments that are leaving → recycle their positions
    for (const [instrument, pos] of instrumentToPos) {
        if (!newInstruments.has(instrument)) {
            instrumentToPos.delete(instrument);
            freePositions.push(pos);
        }
    }

    // Assign positions to new instruments
    for (const instrument of newInstruments) {
        if (!instrumentToPos.has(instrument)) {
            const pos = freePositions.pop();
            if (pos === undefined) {
                console.error(`[SHM] No free positions for Instrument ${instrument}`);
                continue;
            }
            instrumentToPos.set(instrument, pos);
            // Write instrument number into SHM immediately so C++ knows what's in this slot
            const base = pos * OFF.OPTIONS.__bytesPerSlot;
            optionsDV.setFloat64(base + OFF.OPTIONS.instrument, instrument, true);
        }
    }
}

// ── onSocketTick — called from optionChain.stream.js ──────────────────────────
function onSocketTick(isIndex, instrument, packet) {
    if (isIndex) {
        _writeIndicsSocket(instrument, packet);
    }
    else {
        _writeOptionSocket(instrument, packet);
    }
}

// ── onPollData — called from optionApiPolls.stream.js ─────────────────────────
function onPollData(data) {
    // 1. IndiaVix → indics buffer
    if (data.indiavixData) {
        const vix = data.indiavixData;
        _writeIndicsVix(vix);
    }

    // 2. optionsChain — first row is index (strike_price === -1), rest are options
    for (const row of data.optionsChain) {
        if (row.strike_price === -1) {
            _writeIndicsFromPoll(row);
            continue;
        }
        _writeOptionPoll(row);
    }
}

// ── Internal writers ──────────────────────────────────────────────────────────

function _writeIndicsSocket(instrument, p) {
    const base = (instrument - 1) * OFF.INDICS.__bytesPerSlot;  // instrument 1=NIFTY, 2=BANKNIFTY etc.
    const v    = indicsDV;
    const O    = OFF.INDICS;

    v.setFloat64(base + O.instrument,       instrument,                true);
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
    const base = 0;
    const v    = indicsDV;
    const O    = OFF.INDICS;

    v.setFloat64(base + O.fp,               row.fp               ?? 0, true);
    v.setFloat64(base + O.fpch,             row.fpch             ?? 0, true);
    v.setFloat64(base + O.fpchp,            row.fpchp            ?? 0, true);
}

function _writeIndicsVix(vix) {
    const base = 0;
    const v    = indicsDV;
    const O    = OFF.INDICS;

    v.setFloat64(base + O.iVixLtp,          vix.ltp              ?? 0, true);
    v.setFloat64(base + O.iVixCh,           vix.ltpch            ?? 0, true);
    v.setFloat64(base + O.iVixChp,          vix.ltpchp           ?? 0, true);
}

function _writeOptionSocket(instrument, p) {
    const pos = instrumentToPos.get(instrument);
    if (pos === undefined) return;  // not in active window, ignore

    const base = pos * OFF.OPTIONS.__bytesPerSlot;
    const v    = optionsDV;
    const O    = OFF.OPTIONS;

    v.setFloat64(base + O.instrument,       instrument           ?? 0, true);
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
    const instrument = symbolToInstrument.get(row.symbol);
    if (instrument === undefined) return;   // outside current ATM window, skip

    const pos = instrumentToPos.get(instrument);
    if (pos === undefined) return;

    const base = pos * OFF.OPTIONS.__bytesPerSlot;
    const v    = optionsDV;
    const O    = OFF.OPTIONS
    const g    = row.greeks ?? {};

    v.setFloat64(base + O.oi,               row.oi               ?? 0, true);
    v.setFloat64(base + O.chngInOi,         row.oich             ?? 0, true);
    v.setFloat64(base + O.prevOi,           row.prev_oi          ?? 0, true);
    v.setFloat64(base + O.delta,            g.delta              ?? 0, true);
    v.setFloat64(base + O.theta,            g.theta              ?? 0, true);
    v.setFloat64(base + O.gamma,            g.gamma              ?? 0, true);
    v.setFloat64(base + O.vega,             g.vega               ?? 0, true);
}

export { initShm, setReady, applyMap, onSocketTick, onPollData };
