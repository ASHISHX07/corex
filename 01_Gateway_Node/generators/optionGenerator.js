import path from 'path';
import { fileURLToPath } from 'url';
import { optionSymbolName, optionInstrument } from './symbology.js';
import getDateTime from '../timers/atomicClock.js';
import { safeRead, safeWrite } from '../helpers/fs.helper.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../Config/option-config.json');
const statePath  = path.resolve(__dirname, '../../runtime/option-state.json');

const STRIKE_GAP = {
    NIFTY: 50,
    BANKNIFTY: 100,
    SENSEX: 100,
    BANKEX: 100
}

// ----- Config & State ----------------------------------------------

const niftyGap     = 50;
const bankniftyGap = 100;

const optionManager = {
    exchange: "NSE",
    underlyingSymbol: "NIFTY",
    lastTwoDigitOfYear: 26,
    month: 5,
    day: 5,
    strikePrice: 24100,
    optionType: "CE",
    isMonthly: false,
    visibility: 4
}

let isNifty = optionManager.underlyingSymbol === "NIFTY";
let visibility = (optionManager.visibility * 2) + 1;

isNifty ? optionManager.strikePrice -= (optionManager.visibility * niftyGap) : optionManager.strikePrice -= (optionManager.visibility * bankniftyGap)

// function getOptionChainSymbols() {
    
//     let symbolArr = [];
    
//     for (let i = 1; i <= visibility; ++i) {

//         let CESymbol = optionSymbolName(optionManager);
//         let CEInstrument = optionInstrument(optionManager.exchange, optionManager.underlyingSymbol, optionManager.lastTwoDigitOfYear, optionManager.month, optionManager.day, optionManager.strikePrice, optionManager.optionType, optionManager.isMonthly);

//         symbolArr.push(CEInstrument, CESymbol);
//         optionManager.optionType = "PE";
        
//         let PESymbol = optionSymbolName(optionManager);
//         let PEInstrument = optionInstrument(optionManager.exchange, optionManager.underlyingSymbol, optionManager.lastTwoDigitOfYear, optionManager.month, optionManager.day, optionManager.strikePrice, optionManager.optionType, optionManager.isMonthly);
        
//         symbolArr.push(PEInstrument, PESymbol);
//         optionManager.optionType = "CE";

//         isNifty ? optionManager.strikePrice += niftyGap : optionManager.strikePrice += bankniftyGap;
//     }
//     // console.log(symbolArr);
    
//     return symbolArr;
// }

// export default getOptionChainSymbols;