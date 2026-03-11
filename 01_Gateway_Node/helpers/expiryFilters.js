async function dateFilter(holidaysArr = []) {
    
    const newArray = [];
    let type = holidaysArr.length == 1 ? 1 : 2;

    holidaysArr.forEach((date, index) => {
        if (typeof date === "string") {
            date.replaceAll('/', '');
            if (holidaysArr.length == 1) {
                return Number(date);
            }
            newArray[index] = Number(date);
        }
        else {
            console.error(`[NODE ERROR] given ${type == 1 ? "date" : "Array of dates"} contains non-string ${type == 1 ? 
                "value" : `element at index ${index}`}`);
            process.exit(0);
        }
    })

    return newArray;

}

export default dateFilter;