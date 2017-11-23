"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TheError;
(function (TheError) {
    TheError["NotFound"] = "NotFound";
    TheError["ArgumentError"] = "ArgumentError";
    TheError["NotSingle"] = "NotSingle";
    TheError["KeyRepeat"] = "KeyRepeat";
    TheError["Never"] = "Never";
})(TheError = exports.TheError || (exports.TheError = {}));
var Comparers;
(function (Comparers) {
    Comparers[Comparers['<'] = -1] = '<';
    Comparers[Comparers['='] = 0] = '=';
    Comparers[Comparers['>'] = 1] = '>';
})(Comparers = exports.Comparers || (exports.Comparers = {}));
exports.Equal = (x, y) => x === y;
exports.Predicate = v => true;
exports.Selector = v => v;
exports.Comparer = (x, y) => x < y ? Comparers['<'] : x === y ? Comparers['='] : Comparers['>'];
exports.ResultSelector = (source, element) => element;
exports.ESType = {
    string: (o) => typeof (o) === 'string',
    number: (o) => typeof (o) === 'number',
    boolean: (o) => typeof (o) === 'boolean',
    symbol: (o) => typeof (o) === 'symbol',
    undefined: (o) => typeof (o) === 'undefined',
    object: (o) => typeof (o) === 'object',
    function: (o) => typeof (o) === 'function',
    any: (o) => true
};
