import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { weeklyOptionSymbolName, monthlyOptionSymbolName } from './symbology.js';
import getDateTime from '../timers/atomicClock.js';

/**
 * returns an array of option chain symbols, or array containing multiple arrays of option chain symbols
 * @param {String} exchange exchange eg. NSE, BSE, MCX
 * @param {String} segment segment eg. NIFTY, BANKNIFTY, SENSEX, CRUDEOIL
 * @param {Number} pointsFromStrike distance from the strike eg. to get 2 ITM and OTM, use 2, this includes both CE and PE
 * @param {Number} visibility the range you want of farthest option expiry eg. to get next 4 expiry's use 4
*/

async function getOptionChain({exchange, segment, pointsFromStrike, visibility}) {

    let symbols = [];

    const now = await getDateTime();
    const date = now.toLocaleDateString();
    
}

getOptionChain({exchange: 1, segment: 1, pointsFromStrike: 1, visibility: 1});

export {
    getOptionChain,
}