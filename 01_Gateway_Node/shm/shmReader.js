import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { safeRead } from "../helpers/fs.helper.js";
import { config } from "../helpers/loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const bridge    = require(path.join(__dirname, '../bridge/build/shm_bridge.node'));
const OFF       = JSON.parse(safeRead(path.resolve(__dirname, '../../runtime/shm-offsets.json')));

const indicesCount = config.INDICS?.length ?? 1;
const optionsCount = (config.visibility * 2 + 1) * 2;

// ── Views (shared with shmWriter via same bridge buffers) ─────────────────────
let ctrlView  = null;
let indicsDV  = null;
let optionsDV = null;
let orderDV   = null;

let lastCtrlSignal = 0;
const lastIndicsSignal = new Int32Array(indicesCount);
const lastOptionSignal = new Int32Array(optionsCount);

let _onOrder = null;
function setOrderHandler(fn) { _onOrder = fn; }

function initReader() {
    const ctrlBuf = bridge.getControllerBuffer();
    const indicsBuf = bridge.getIndicsDataBuffer(indicesCount * OFF.INDICS.__bytesPerSlot);
    const optionsBuf = bridge.getOptionChainBuffer(optionsCount * OFF.OPTIONS.__bytesPerSlot);
    const orderBuf = bridge.getOrderBuffer(OFF.ORDER.__bytesPerSlot);

    ctrlView = new Int32Array(ctrlBuf.buffer, ctrlBuf.byteOffset, OFF.CONTROLLER.__bytesPerSlot / 4);
    indicsDV = new DataView(indicsBuf.buffer, indicsBuf.byteOffset);
    optionsDV = new DataView(optionsBuf.buffer, optionsBuf.byteOffset);
    orderDV = new DataView(orderBuf.buffer, orderBuf.byteOffset);

    console.log("[SHM] Reader Initialized");
}

function startSignalWatch(intervalMs = 50) {
    if (!ctrlView) throw new Error('[SHM] Call initReader first');

    setInterval(() => {
        _checkController();
        _checkIndics();
        _checkOptions();
        _checkOrder();
    }, intervalMs);
}

// ── Internal checkers ─────────────────────────────────────────────────────────

function _checkController() {
    const signal = ctrlView[OFF.CONTROLLER.signal / 4];
    if (signal !== 0 && signal !== lastCtrlSignal) {
        lastCtrlSignal = signal;
        console.log(`[SHM] controller signal ${signal}`);
        ctrlView[OFF.CONTROLLER.action / 4] = signal;
    }
}

function _checkIndics() {
    for (let i = 0; i < indicesCount; i++) {
        const base = i * OFF.INDICS.__bytesPerSlot;
        const signal = indicsDV.getInt32(base + OFF.INDICS.signal, true);
        if (signal !== 0 && signal !== lastIndicsSignal[i]) {
            lastIndicsSignal[i] = signal;
            const instrument = indicsDV.getFloat64(base + OFF.INDICS.instrument, true);
            console.log(`[SHM] INDICS slot ${i} (instrument ${instrument}) signal ${signal}`);
            indicsDV.setInt32(base + OFF.INDICS.action, signal, true);
        }
    }
}

function _checkOptions() {
    for (let i = 0; i < optionsCount; i++) {
        const base = i * OFF.OPTIONS.__bytesPerSlot;
        const signal = optionsDV.getInt32(base + OFF.OPTIONS.signal, true);
        if (signal !== 0 && signal !== lastOptionSignal[i]) {
            lastOptionSignal[i] = signal;
            const instrument = optionsDV.getFloat64(base + OFF.OPTIONS.instrument, true);
            console.log(`[SHM] OPTIONS slot ${i} (instrument ${instrument}) signal ${signal}`);
            optionsDV.setInt32(base + OFF.OPTIONS.action, signal, true);
        }
    }
}

function _checkOrder() {
    if (!orderDV) return;
    const O = OFF.ORDER;
    const status = orderDV.getFloat64(O.status, true);
    if (status !== 1) return;

    orderDV.setFloat64(O.status, 2, true);

    const count         = orderDV.getFloat64(O.count, true);
    const strategyId    = orderDV.getFloat64(O.strategyId, true);
    const timestamp     = orderDV.getFloat64(O.timestamp, true);

    const legs = [];
    for (let i = 0; i < Math.min(count, O.__maxLegs); i++) {
        legs.push({
            instrument: orderDV.getFloat64(O[`leg${i}_instrument`], true),
            side      : orderDV.getFloat64(O[`leg${i}_side  `],     true),
            orderType : orderDV.getFloat64(O[`leg${i}_orderType`],  true),
            qty       : orderDV.getFloat64(O[`leg${i}_qty`],        true),
            limitPrice: orderDV.getFloat64(O[`leg${i}_limitPrice`], true),
            stopPrice : orderDV.getFloat64(O[`leg${i}_stopPrice`],  true),
            slPrice   : orderDV.getFloat64(O[`leg${i}_slPrice`],    true),
            takeProfit: orderDV.getFloat64(O[`leg${i}_takeProfit`], true)
        });
    }
    console.log(`[SHM] ORDER picked up — strategyId ${strategyId}, ${count} leg(s)`);

    if(_onOrder) {
        _onOrder({ strategyId, timestamp, legs }, (result) => {
            // result: 'ok' | 'fail'  — called by orderManager after API response
            orderDV.setFloat64(O.status, result === 'ok' ? 3 : -1, true);
        });
    }
}

export { initReader, startSignalWatch, setOrderHandler };