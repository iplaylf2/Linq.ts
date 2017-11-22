"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Stream_1 = require("./Stream");
var TheError;
(function (TheError) {
    TheError["NotFound"] = "NotFound";
    TheError["ArgumentError"] = "ArgumentError";
})(TheError || (TheError = {}));
var Comparers;
(function (Comparers) {
    Comparers[Comparers['<'] = -1] = '<';
    Comparers[Comparers['='] = 0] = '=';
    Comparers[Comparers['>'] = 1] = '>';
})(Comparers || (Comparers = {}));
const Equal = (x, y) => x === y;
const Predicate = v => true;
const Selector = v => v;
class Enumerable {
    constructor(s) {
        this.GetStream = () => s;
    }
    [Symbol.iterator]() {
        return this.GetStream()[Symbol.iterator]();
    }
    static CreateFrom(iterable) {
        return new Enumerable(Stream_1.Stream.CreateFrom(iterable));
    }
    static Empty() {
        return new Enumerable(Stream_1.Stream.Empty());
    }
    static Range(start, count) {
        return new Enumerable(new Stream_1.Stream(Stream_1.Stream.Head, () => Create.Range(start, count)));
    }
    static Repeat(element, count) {
        return new Enumerable(new Stream_1.Stream(Stream_1.Stream.Head, () => Create.Repeat(element, count)));
    }
    Aggregate(arg0, arg1, arg2) {
        if (ESType.function(arg0) && ESType.undefined(arg1) && ESType.undefined(arg2)) {
            return this.GetStream().reduce(arg0);
        }
        if (ESType.any(arg0) && ESType.function(arg1) && ESType.undefined(arg2)) {
            return this.GetStream().reduce(arg1, arg0);
        }
        if (ESType.any(arg0) && ESType.function(arg1) && ESType.function(arg2)) {
            return arg2(this.GetStream().reduce(arg1, arg0));
        }
        throw TheError.ArgumentError;
    }
    All(predicate) {
        return !this.GetStream().has(v => !predicate(v));
    }
    Any(predicate = Predicate) {
        return this.GetStream().has(predicate);
    }
    Average(selector = Selector) {
        var i = 0;
        return this.GetStream().reduce((avg, x) => avg += (selector(x) - avg) / (i++ + 1), 0);
    }
    Concat(second) {
        return new Enumerable(this.GetStream().concat(second.GetStream()));
    }
    ;
    Contains(value, equal = Equal) {
        return this.GetStream().has(v => equal(value, v));
    }
    Count(predicate = Predicate) {
        return this.GetStream().reduce((l, c) => predicate(c) ? l + 1 : l, 0);
    }
    DefaultIfEmpty(defaultValue) {
        return new Enumerable(new Stream_1.Stream(Stream_1.Stream.Head, () => {
            var s = this.GetStream().next();
            return Stream_1.Stream.IsEnd(s) ? new Stream_1.Stream(defaultValue, Stream_1.Stream.End) : s;
        }));
    }
    Distinct(equal = Equal) {
        return new Enumerable(this.GetStream().distinct(equal));
    }
    ElementAt(index) {
        return this.GetStream().ref(v => index-- === 0 ? true : false);
    }
    Except(second, equal = Equal) {
        return new Enumerable(this.GetStream().except(second.GetStream(), equal));
    }
}
exports.Enumerable = Enumerable;
const Create = {
    Range: function create(start, count) {
        return count === 0 ? Stream_1.Stream.End : new Stream_1.Stream(start, () => create(start + 1, count - 1));
    },
    Repeat: function create(element, count) {
        return count === 0 ? Stream_1.Stream.End : new Stream_1.Stream(element, () => create(element, count - 1));
    }
};
const ESType = {
    string: (o) => typeof (o) === 'string',
    number: (o) => typeof (o) === 'number',
    boolean: (o) => typeof (o) === 'boolean',
    symbol: (o) => typeof (o) === 'symbol',
    undefined: (o) => typeof (o) === 'undefined',
    object: (o) => typeof (o) === 'object',
    function: (o) => typeof (o) === 'function',
    any: (o) => true
};
Enumerable.Range(2, 5).ElementAt(2);
