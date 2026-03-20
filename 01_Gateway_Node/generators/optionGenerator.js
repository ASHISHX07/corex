import path from 'path';
import { fileURLToPath } from 'url';
import { optionSymbolName, optionInstrument} from './symbology.js';
import dateFilter from '../helpers/expiryFilters.js';
import getDateTime from '../timers/atomicClock.js';
import { readFileSync } from 'fs';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const expiryPath = path.resolve(__dirname, "../../Data/cache/expiry's.json");
// const expiryDates = JSON.parse(readFileSync(expiryPath, 'utf8'));

const niftyGap = 50;
const bankniftyGap = 100;
const sensexGap = 100;
const bankexGap = 100;

const optionManager = {
    exchange: "NSE",
    underlyingSymbol: "NIFTY",
    lastTwoDigitOfYear: 26,
    month: 3,
    day: 24,
    strikePrice: 21300,
    optionType: "CE",
    isMonthly: false,
    distance: 1
}

async function getOptionChain() {

    let symbolArr = [];
    
    for (let i = 1; i <= optionManager.distance; ++i) {

        let CESymbol = optionSymbolName(optionManager);
        let CEInstrument = optionInstrument(optionManager.exchange, optionManager.underlyingSymbol, optionManager.lastTwoDigitOfYear, optionManager.month, optionManager.day, optionManager.strikePrice, optionManager.optionType, optionManager.isMonthly);

        symbolArr.push(CEInstrument, CESymbol);
        optionManager.optionType = "PE";
        
        let PESymbol = optionSymbolName(optionManager);
        let PEInstrument = optionInstrument(optionManager.exchange, optionManager.underlyingSymbol, optionManager.lastTwoDigitOfYear, optionManager.month, optionManager.day, optionManager.strikePrice, optionManager.optionType, optionManager.isMonthly);
        
        symbolArr.push(PEInstrument, PESymbol);
        optionManager.optionType = "CE";

    }

    console.log(symbolArr);
    

    return symbolArr;

}

await getOptionChain();

export default getOptionChain;