function lookUpTable(num) {
    var colorTable = {
        0: {r: 255, g: 255, b: 255},
        1: {r: 128, g: 174, b: 128},
        2: {r: 241, g: 214, b: 145},
        3: {r: 177, g: 122, b: 101},
        4: {r: 111, g: 184, b: 210},
        5: {r: 216, g: 101, b: 79},
        6: {r: 221, g: 130, b: 101},
        7: {r: 144, g: 138, b: 144},
        8: {r: 192, g: 104, b: 88},
        9: {r: 220, g: 245, b: 20}
    };
    return colorTable[num];
}

export default lookUpTable;
