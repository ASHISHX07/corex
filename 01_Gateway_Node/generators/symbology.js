/**
 * returns the symbol name for NSE BSE option symbol
 * @param {string} exchange exchange eg. NSE, BSE
 * @param {String} underlyingSymbol underlying symbol name eg. NIFTY, BANKNIFTY, SENSEX, BANKEX
 * @param {Number} lastTwoDigitOfYear last two digits of year or four if decade eg. 19, 2020, 21, 22, 23
 * @param {Number || char} month single digit or character depending on month eg. 1, 2, 3, 4, 5, 6, 7, 8, 9, O, N, D
 * @param {Number} day single or double digit number eg. 1, 8, 14, 27
 * @param {Number} strike strike price you're looking for eg. 22000, 21450, 55000, 57800 (strike difference can differ between underlying symbol)
 * @param {String} optionType type of the option eg. CE, PE
 * @returns {String} The final symbol name for weekly option symbol
 */
function optionSymbolName(exchange, underlyingSymbol, lastTwoDigitOfYear, month, day, strike, optionType, isMonthly) {

    let monthPart;

    if (isMonthly) {
        const monthMap = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        monthPart = monthMap[month];
    } 
    else {
        const weeklyMonthMap = { 10: 'O', 11: 'N', 12: 'D' };
        monthPart = weeklyMonthMap[month] || month;
    }

    const dayPart = isMonthly ? '' : String(day).padStart(2, '0');
    
    return `${exchange}:${underlyingSymbol}${lastTwoDigitOfYear}${formattedMonth}${formattedDay}${strike}${optionType}`;
}

export {
    optionSymbolName
}