export var TheError;
(function (TheError) {
    TheError["NotFound"] = "NotFound";
    TheError["ArgumentError"] = "ArgumentError";
    TheError["NotSingle"] = "NotSingle";
    TheError["KeyRepeat"] = "KeyRepeat";
    TheError["Never"] = "Never";
})(TheError || (TheError = {}));
export var Comparers;
(function (Comparers) {
    Comparers[Comparers['<'] = -1] = '<';
    Comparers[Comparers['='] = 0] = '=';
    Comparers[Comparers['>'] = 1] = '>';
})(Comparers || (Comparers = {}));
export const Equal = (x, y) => x === y;
export const Predicate = v => true;
export const Selector = v => v;
export const Comparer = (x, y) => x < y ? Comparers['<'] : x === y ? Comparers['='] : Comparers['>'];
export const ResultSelector = (source, element) => element;
export const ESType = {
    string: (o) => typeof (o) === 'string',
    number: (o) => typeof (o) === 'number',
    boolean: (o) => typeof (o) === 'boolean',
    symbol: (o) => typeof (o) === 'symbol',
    undefined: (o) => typeof (o) === 'undefined',
    object: (o) => typeof (o) === 'object',
    function: (o) => typeof (o) === 'function',
    any: (o) => true
};
