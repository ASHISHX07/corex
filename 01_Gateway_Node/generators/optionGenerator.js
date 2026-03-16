import path from 'path';
import { fileURLToPath } from 'url';
import { weeklyOptionSymbolName, monthlyOptionSymbolName } from './symbology.js';
import dateFilter from '../helpers/expiryFilters.js';
import getDateTime from '../timers/atomicClock.js';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const expiryPath = path.resolve(__dirname, "../../Data/cache/expiry's.json");
const expiryDates = JSON.parse(readFileSync(expiryPath, 'utf8'));

const niftyGap = 50;
const bankniftyGap = 100;
const sensexGap = 100;
const bankexGap = 100;

/**
 * returns an array of option chain symbols, or array containing multiple arrays of option chain symbols
 * @param {String} exchange exchange eg. NSE, BSE, MCX
 * @param {String} segment segment eg. NIFTY, BANKNIFTY, SENSEX, CRUDEOIL
 * @param {Number} pointsFromStrike distance from the strike eg. to get 2 ITM and OTM, use 2, this includes both CE and PE
 * @param {Number} visibility the range you want of farthest option expiry eg. to get next 4 expiry's use 4
*/

async function getOptionChain({exchange, segment, pointsFromStrike, isMonthly}) {

    let symbolArr = [];
    
    for (let i = 1; i <= pointsFromStrike; ++i) {

        

    }

}

getOptionChain({exchange: 1, segment: 1, pointsFromStrike: 1, visibility: 1});

export {
    getOptionChain,
}