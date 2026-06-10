import path from 'path';
import { fileURLToPath } from 'url';
import { makeOptionSymbolString, makeOptionInstrument } from './symbology.js';
import getDateTime from '../timers/atomicClock.js';
import { safeRead, safeWrite } from '../helpers/fs.helper.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../Config/option-config.json');
// const statePath  = path.resolve(__dirname, '../../runtime/option-state.json');

const config = JSON.parse(safeRead(configPath));
const STRIKE_GAP = { NIFTY: 50, BANKNIFTY: 100, SENSEX: 100, BANKEX: 100 };

// ----- Config & State ----------------------------------------------

function snapToATM(spot, gap) {
    return Math.round(spot / gap) * gap;
}

/**
 * Builds the option universe for one expiry around ATM.
 *
 * @param {number} spotPrice                - current live spot (e.g. 24350)
 * @param {object} config                   - initial configuration Object
 * @param {string} config.exchange          - "NSE" | "BSE" | "MCX"
 * @param {string} config.underlying        - "NIFTY" | "BANKNIFTY" | "SENSEX" | "BANKEX"
 * @param {number} config.year              - last two digits e.g. 26
 * @param {number} config.month             - 1-12
 * @param {number} config.day               - expiry day (ignored if monthly)
 * @param {boolean} config.isMonthly        - true for monthly expiry
 * @param {number} config.visibility        - strikes on each side of ATM e.g. 4
 *
 * @returns {{ atm: number, map: Map<number,string>, instruments: number[], symbols: string[] }}
 */

const indexAssigns = {
    'NIFTY': 1,
    'BANKNIFTY': 2,
    'SENSEX': 3,
    "BANKEX": 4
}

function buildOptionSymbols(spotPrice) {
    const { exchange, underlying, visibility, activeExpiry, expiries } = config;

    if ( activeExpiry >= expiries.length ) {
        throw new Error(`Invalid expiry selection (in Config/option-config.json)`);
    }
    const active = expiries[activeExpiry];

    const gap = STRIKE_GAP[underlying] ?? 100;
    const atm = snapToATM(spotPrice, gap);
    const low = atm - visibility * gap;
    const total = visibility * 2 + 1;

    /** @type {Map<number, string>} */
    const map = new Map();

    let uStr;
    switch (underlying) {
        case 'NIFTY':
            uStr = 'NIFTY50';
            break;
        case 'BANKNIFTY':
            uStr = 'NIFTYBANK';
            break;
        default:
            uStr = underlying;
            break;
    }
    const index = `${exchange}:${uStr}-INDEX`;

    map.set(indexAssigns[underlying], index);

    for (let i = 0; i < total; i++) {
        const strike = low + i * gap;

        for (const optionType of ['CE', 'PE']) {
            const params = {
                exchange,
                underlyingSymbol: underlying,
                lastTwoDigitOfYear: active.year,
                month: active.month,
                day: active.day,
                strikePrice: strike,
                optionType,
                isMonthly: active.isMonthly,
            };

            const instrument = makeOptionInstrument(params);
            const symbol = makeOptionSymbolString(params);
            map.set(instrument, symbol);
        }
    }
    console.log(map);
    
    return { atm, map };
}

function computeExpiryTimeStamp() {
    const timestamps = config.expiries.map(({year, month, day}) => {
        // month is 1-based, Date.UTC expects 0-based month
        return Math.floor(Date.UTC(2000 + year, month - 1, day, 10, 0, 0) / 1000);
    });

    config.expiryTimeStamps = timestamps;
    safeWrite(configPath, JSON.stringify(config, null, 4));
}

function getExpiryTimeStamp() {
    return config.expiryTimeStamps?.[config.activeExpiry] ?? null;
}

export { buildOptionSymbols, snapToATM, computeExpiryTimeStamp, getExpiryTimeStamp, STRIKE_GAP };
