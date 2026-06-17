import path from 'path';
import { fileURLToPath } from 'url';
import { makeOptionSymbolString } from './symbology.js';
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
    const symbols = [];

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
    symbols.push(index);

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

            const symbol = makeOptionSymbolString(params);
            symbols.push(symbol);
        }
    }

    return { atm, symbols };
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
