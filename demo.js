const { Enumerable } = require('./linq');
var arr = [12, 24, 41, 33, 52, 21, 12, 44, 51, 22, 11, 85, 31, 72, 11, 85, 21, 32, 24, 11, 35, 26, 17, 22, 35, 57, 13, 77, 21, 56, 32, 14, 21];

var n1 = 0;
Enumerable.CreateFrom(arr)
    .OrderBy(v=>v,(x, y) => {
        n1++;
        if (x < y) return -1;
        if (x === y) return 0;
        return 1;
    })
    .ToList();

var n2 = 0;
Enumerable.CreateFrom(arr)
    .OrderBy(v=>v,(x, y) => {
        n2++;
        if (x < y) return -1;
        if (x === y) return 0;
        return 1;
    })
    .Take(10)
    .ToList();
console.log(`n1:${n1}`);
console.log(`n2:${n2}`);
