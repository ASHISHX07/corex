let symbols = [];
export const getSymbols = () => symbols;
export const setSymbols = (map) => {
    symbols = [...map.values()].filter(s => !s.includes('INDEX'));
}