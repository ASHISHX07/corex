/**
 * returns the symbol name for NSE BSE option symbol
 * @param {string} exchange exchange eg. NSE, BSE
 * @param {String} underlyingSymbol underlying symbol name eg. NIFTY, BANKNIFTY, SENSEX, BANKEX
 * @param {Number} lastTwoDigitOfYear last two digits of year or four if decade eg. 19, 2020, 21, 22, 23
 * @param {Number || char} month single digit or characted depending on month eg. 1, 2, 3, 4, 5, 6, 7, 8, 9, O, N, D
 * @param {Number} day single or double digit number eg. 1, 8, 14, 27
 * @param {Number} strike strike price you're looking for eg. 22000, 21450, 55000, 57800 (strike difference can differ between underlying symbol)
 * @param {String} optionType type of the option eg. CE, PE
 * @returns {String} The final symbol name for weekly option symbol
 */
async function weeklyOptionSymbolName(exchange, underlyingSymbol, lastTwoDigitOfYear, month, day, strike, optionType) {
    return `${exchange}:${underlyingSymbol}${lastTwoDigitOfYear}${month}${day}${strike}${optionType}`;
}

/**
 * returns the symbol name for NSE BSE monthly option symbol
 * @param {String} exchange exhange eg. NSE, BSE
 * @param {String} underlyingSymbol underlying symbol name eg. NIFTY50, BANKNIFTY, SENSEX, BANKEX
 * @param {Number} lastTwoDigitOfYear last two digits of year or four if decade eg. 19, 2020, 21, 22, 23
 * @param {String} month month's name in capital latter with first three characters eg. JAN, MAR, NOV, DEC
 * @param {Number} strike strike price you're looking for eg. 22000, 21450, 55000, 57800 (strike difference can differ between underlying symbol)
 * @param {String} optionType type of the option eg. CE, PE
 * @returns {String} the final symbol name for monthly option symbol
 */
async function monthlyOptionSymbolName(exchange, underlyingSymbol, lastTwoDigitOfYear, month, strike, optionType) {
    return `${exchange}:${underlyingSymbol}${lastTwoDigitOfYear}${month}${strike}${optionType}`
}

