(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.linq = {})));
}(this, (function (exports) { 'use strict';

var TheError;
(function (TheError) {
    TheError["NotFound"] = "NotFound";
    TheError["ArgumentError"] = "ArgumentError";
    TheError["NotSingle"] = "NotSingle";
    TheError["KeyRepeat"] = "KeyRepeat";
    TheError["Never"] = "Never";
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
const Comparer = (x, y) => x < y ? Comparers['<'] : x === y ? Comparers['='] : Comparers['>'];
const ResultSelector = (source, element) => element;
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

class Stream {
    constructor(v, next) {
        this.v = v;
        this.next = next;
    }
    [Symbol.iterator]() {
        var s = this;
        return {
            next: () => {
                s = s.next();
                if (Stream.IsEnd(s))
                    return { value: undefined, done: true };
                else
                    return { value: s.v, done: false };
            }
        };
    }
    static IsEnd(s) {
        return s === Stream.End;
    }
    static Map(func, ...sList) {
        return new Stream(Stream.Head, () => Create$1.Map(func, ...sList.map(s => s.next())));
    }
    static CreateFrom(iterable) {
        return new Stream(Stream.Head, () => Create$1.CreateFrom(iterable[Symbol.iterator]()));
    }
    static Empty() {
        return new Stream(Stream.Head, () => Stream.End);
    }
    static Create(v, next) {
        return new Stream(Stream.Head, () => new Stream(v, next));
    }
    /*prototype*/
    forEach(action) {
        var s = this.next();
        while (!Stream.IsEnd(s)) {
            action(s.v);
            s = s.next();
        }
    }
    reduce(product, initial) {
        var result, s = this;
        if (initial === undefined) {
            s = s.next();
            result = s.v;
        }
        else {
            result = initial;
        }
        s.forEach(v => {
            result = product(result, v);
        });
        return result;
    }
    toList() {
        return this.reduce((arr, v) => {
            arr.push(v);
            return arr;
        }, new Array());
    }
    equal(second, equal) {
        var first = this, a, b;
        do {
            first = first.next();
            second = second.next();
            a = Stream.IsEnd(first);
            b = Stream.IsEnd(second);
            if (a !== b)
                return false;
            else if (a)
                return true;
            else if (!equal(first.v, second.v))
                return false;
        } while (true);
    }
    ref(predicate) {
        var s = this.next();
        while (!Stream.IsEnd(s)) {
            if (predicate(s.v))
                return s.v;
            s = s.next();
        }
        throw TheError.NotFound;
    }
    has(predicate) {
        var s = this.next();
        while (!Stream.IsEnd(s)) {
            if (predicate(s.v))
                return true;
            s = s.next();
        }
        return false;
    }
    shunt(predicate) {
        var arr1 = [], arr2 = [], source = { s: this };
        return [new Stream(Stream.Head, () => Create$1.shunt(predicate, arr1, arr2, source, 0)),
            new Stream(Stream.Head, () => Create$1.shunt(v => !predicate(v), arr2, arr1, source, 0))];
    }
    /*lazy*/
    map(func) {
        return Stream.Map(func, this);
    }
    filter(predicate) {
        return new Stream(Stream.Head, () => Create$1.filter(predicate, this.next()));
    }
    concat(second) {
        return new Stream(Stream.Head, () => Create$1.concat(second, this.next()));
    }
    sort(comparer) {
        return new Stream(Stream.Head, () => Create$1.sort(comparer, this.next()));
    }
    distinct(equal) {
        return new Stream(Stream.Head, () => Create$1.distinct(equal, this.next()));
    }
    union(second, equal) {
        return this.concat(second).distinct(equal);
    }
    intersect(second, equal) {
        return new Stream(Stream.Head, () => Create$1.intersect(equal, Create$1.distinct(equal, this.next()), second));
    }
    except(second, equal) {
        return new Stream(Stream.Head, () => Create$1.except(equal, Create$1.distinct(equal, this.next()), second));
    }
    skip(predicate) {
        return new Stream(Stream.Head, () => Create$1.skip(predicate, this.next()));
    }
    take(predicate) {
        return new Stream(Stream.Head, () => Create$1.take(predicate, this.next()));
    }
    cache() {
        var next, flag = true;
        return new Stream(Stream.Head, () => {
            if (flag) {
                next = Create$1.cache(this.next());
                flag = false;
            }
            
            return next;
        });
    }
}
Stream.End = (() => {
    var end = new Stream(undefined, () => end);
    return end;
})();
var Create$1 = {
    Map: function create(func, ...sList) {
        return Stream.IsEnd(sList[0]) ? Stream.End : new Stream(func(...sList.map(s => s.v)), () => create(func, ...sList.map(s => s.next())));
    },
    CreateFrom: function create(iterator) {
        var result = iterator.next();
        return result.done ? Stream.End : new Stream(result.value, () => create(iterator));
    },
    shunt: function create(predicate, useful, useless, source, i) {
        if (useful.length !== i) {
            return new Stream(useful[i], () => create(predicate, useful, useless, source, i + 1));
        }
        else {
            source.s = source.s.next();
            if (Stream.IsEnd(source.s)) {
                return Stream.End;
            }
            else {
                if (predicate(source.s.v)) {
                    useful.push(source.s.v);
                    return new Stream(useful[i], () => create(predicate, useful, useless, source, i + 1));
                }
                else {
                    useless.push(source.s.v);
                    return create(predicate, useful, useless, source, i);
                }
            }
        }
    },
    filter: function create(predicate, s) {
        return Stream.IsEnd(s) ? Stream.End
            : predicate(s.v) ? new Stream(s.v, () => create(predicate, s.next())) : create(predicate, s.next());
    },
    concat: function create(second, first) {
        return Stream.IsEnd(first) ? second.next() : new Stream(first.v, () => create(second, first.next()));
    },
    sort: function (comparer, s) {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            var [s1, s2] = s.shunt(v => comparer(s.v, v) === Comparers['>']);
            return Create$1.concat(Stream.Create(s.v, () => Create$1.sort(comparer, s2.next())), Create$1.sort(comparer, s1.next()));
        }
    },
    distinct: function create(equal, s) {
        return Stream.IsEnd(s) ? Stream.End : new Stream(s.v, () => create(equal, Create$1.filter(v => !equal(s.v, v), s)));
    },
    intersect: function create(equal, first, second) {
        if (Stream.IsEnd(first)) {
            return Stream.End;
        }
        else {
            var [eq, neq] = second.shunt(v => equal(first.v, v));
            if (Stream.IsEnd(eq.next()))
                return create(equal, first.next(), neq);
            else
                return new Stream(first.v, () => create(equal, first.next(), neq));
        }
    },
    except: function create(equal, first, second) {
        if (Stream.IsEnd(first)) {
            return Stream.End;
        }
        else {
            var [eq, neq] = second.shunt(v => equal(first.v, v));
            if (Stream.IsEnd(eq.next()))
                return new Stream(first.v, () => create(equal, first.next(), neq));
            else
                return create(equal, first.next(), neq);
        }
    },
    skip: function create(predicate, s) {
        return Stream.IsEnd(s) ? Stream.End :
            predicate(s.v) ? create(predicate, s.next()) : s;
    },
    take: function create(predicate, s) {
        return Stream.IsEnd(s) ? Stream.End :
            predicate(s.v) ? new Stream(s.v, () => create(predicate, s.next())) : Stream.End;
    },
    cache: function create(s) {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            var next, flag = true;
            return new Stream(s.v, () => {
                if (flag) {
                    next = create(s.next());
                    flag = false;
                }
                return next;
            });
        }
    }
};

class Enumerable {
    constructor(s) {
        this.GetStream = () => s;
    }
    [Symbol.iterator]() {
        return this.GetStream()[Symbol.iterator]();
    }
    static CreateFrom(iterable) {
        return new Enumerable(Stream.CreateFrom(iterable));
    }
    static Empty() {
        return new Enumerable(Stream.Empty());
    }
    static Range(start, count) {
        return new Enumerable(new Stream(Stream.Head, () => Create$$1.Range(start, count)));
    }
    static Repeat(element, count) {
        return new Enumerable(new Stream(Stream.Head, () => Create$$1.Repeat(element, count)));
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
    Contains(value, equal = Equal) {
        return this.GetStream().has(v => equal(value, v));
    }
    Count(predicate = Predicate) {
        return this.GetStream().reduce((l, c) => predicate(c) ? l + 1 : l, 0);
    }
    DefaultIfEmpty(defaultValue) {
        return new Enumerable(new Stream(Stream.Head, () => {
            var s = this.GetStream().next();
            return Stream.IsEnd(s) ? new Stream(defaultValue, Stream.End) : s;
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
    First(predicate = Predicate) {
        return this.GetStream().ref(predicate);
    }
    GroupBy(keySelector, equal = Equal, elementSelector = Selector, resultSelector) {
        var s = new Stream(Stream.Head, () => Create$$1.GroupBy(keySelector, equal, elementSelector, this.GetStream().next()));
        return ESType.function(resultSelector) ? new Enumerable(s.map(v => resultSelector(v.Key, v))) : new Enumerable(s);
    }
    GroupJoin(inner, outerKeySelector, innerKeySelector, resultSelector, equal = Equal) {
        var innerStream = inner.GetStream().cache();
        return new Enumerable(this.GetStream().map(v => {
            var key = outerKeySelector(v);
            return resultSelector(v, new Enumerable(innerStream.filter(v => equal(key, innerKeySelector(v)))));
        }));
    }
    Intersect(second, equal = Equal) {
        return new Enumerable(this.GetStream().intersect(second.GetStream(), equal));
    }
    Join(inner, outerKeySelector, innerKeySelector, resultSelector, equal = Equal) {
        return new Enumerable(new Stream(Stream.Head, () => Create$$1.Join(this.GetStream().next(), inner.GetStream().cache(), outerKeySelector, innerKeySelector, resultSelector, equal)));
    }
    Last(predicate = Predicate) {
        var found = false, result;
        this.GetStream().forEach(v => {
            if (predicate(v)) {
                found = true;
                result = v;
            }
        });
        if (found)
            return result;
        throw TheError.NotFound;
    }
    Max(comparer = Comparer) {
        return this.GetStream().reduce((l, c) => comparer(l, c) === Comparers['>'] ? l : c);
    }
    Min(comparer = Comparer) {
        return this.GetStream().reduce((l, c) => comparer(l, c) === Comparers['<'] ? l : c);
    }
    OrderBy(keySelector, comparer = Comparer) {
        return new OrderedEnumerable(this.GetStream(), Create$$1.Comparer(keySelector, comparer));
    }
    OrderByDescending(keySelector, comparer = Comparer) {
        return new OrderedEnumerable(this.GetStream(), Create$$1.Comparer(keySelector, (x, y) => {
            switch (comparer(x, y)) {
                case Comparers['<']:
                    return Comparers['>'];
                case Comparers['>']:
                    return Comparers['<'];
                case Comparers['=']:
                    return Comparers['='];
                default:
                    throw TheError.Never;
            }
        }));
    }
    Reverse() {
        return new Enumerable(Stream.CreateFrom(this.GetStream().toList().reverse()));
    }
    Select(selector) {
        var i = 0;
        return new Enumerable(this.GetStream().map(v => selector(v, i++)));
    }
    SelectMany(collectionSelector, resultSelector = ResultSelector) {
        var i = 0;
        return new Enumerable(this.GetStream().map(source => collectionSelector(source, i++).GetStream().map(collection => resultSelector(source, collection))).reduce((l, c) => l.concat(c), Stream.Empty()));
    }
    SequenceEqual(second, equal = Equal) {
        return this.GetStream().equal(second.GetStream(), equal);
    }
    Single(predicate = Predicate) {
        var found = false, result;
        this.GetStream().forEach(v => {
            if (predicate(v)) {
                if (found)
                    throw TheError.NotSingle;
                found = true;
                result = v;
            }
        });
        if (found)
            return result;
        throw TheError.NotFound;
    }
    Skip(count) {
        return new Enumerable(this.GetStream().skip(v => count-- !== 0));
    }
    SkipWhile(predicate) {
        var i = 0;
        return new Enumerable(this.GetStream().skip(v => predicate(v, i++)));
    }
    Sum(selector = Selector) {
        return this.GetStream().reduce((sum, x) => sum + selector(x), 0);
    }
    Take(count) {
        return new Enumerable(this.GetStream().take(v => count-- !== 0));
    }
    TakeWhile(predicate) {
        var i = 0;
        return new Enumerable(this.GetStream().take(v => predicate(v, i++)));
    }
    ToDictionary(keySelector, equal = Equal, elementSelector = Selector) {
        return this.GetStream().reduce((l, c) => {
            var key = keySelector(c);
            for (var k of l.keys()) {
                if (equal(key, k))
                    throw TheError.KeyRepeat;
            }
            l.set(key, elementSelector(c));
            return l;
        }, new Map());
    }
    ToList() {
        return this.GetStream().toList();
    }
    ToLookup(keySelector, equal = Equal, elementSelector = Selector) {
        return new Lookup(this.GroupBy(keySelector, equal, elementSelector).GetStream());
    }
    Union(second, equal = Equal) {
        return new Enumerable(this.GetStream().union(second.GetStream(), equal));
    }
    Where(predicate) {
        var i = 0;
        return new Enumerable(this.GetStream().filter(v => predicate(v, i++)));
    }
    Zip(second, resultSelector) {
        return new Enumerable(Stream.Map(resultSelector, this.GetStream(), second.GetStream()));
    }
}
class OrderedEnumerable extends Enumerable {
    constructor(s, comparer) {
        super(s.sort(comparer));
        this.ThenBy = (ks, cp = Comparer) => {
            return new OrderedEnumerable(s, (x, y) => {
                var last = comparer(x, y);
                if (last === Comparers['=']) {
                    return cp(ks(x), ks(y));
                }
                return last;
            });
        };
        this.ThenByDescending = (ks, cp = Comparer) => {
            return new OrderedEnumerable(s, (x, y) => {
                var last = comparer(x, y);
                if (last === Comparers['=']) {
                    switch (cp(ks(x), ks(y))) {
                        case Comparers['<']:
                            return Comparers['>'];
                        case Comparers['>']:
                            return Comparers['<'];
                        case Comparers['=']:
                            return Comparers['='];
                        default:
                            throw TheError.Never;
                    }
                }
                return last;
            });
        };
    }
}
class Grouping extends Enumerable {
    constructor(key, elements) {
        super(elements);
        this.Key = key;
    }
}
class Lookup extends Enumerable {
    constructor(s) {
        super(s);
    }
    Get(key) {
        return this.First(v => v.Key === key);
    }
    ContainsKey(key) {
        return this.Any(v => v.Key === key);
    }
}
const Create$$1 = {
    Range: function create(start, count) {
        return count === 0 ? Stream.End : new Stream(start, () => create(start + 1, count - 1));
    },
    Repeat: function create(element, count) {
        return count === 0 ? Stream.End : new Stream(element, () => create(element, count - 1));
    },
    GroupBy: function create(keySelector, equal, elementSelector, s) {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            var key = keySelector(s.v), value = elementSelector(s.v);
            var [result, rest] = s.shunt(v => equal(key, keySelector(v)));
            return new Stream(new Grouping(key, Stream.Create(value, () => Create$1.Map(elementSelector, result.next()))), () => create(keySelector, equal, elementSelector, rest.next()));
        }
    },
    Join: function create(outer, inner, outerKeySelector, innerKeySelector, resultSelector, equal) {
        if (Stream.IsEnd(outer)) {
            return Stream.End;
        }
        else {
            var outerKey = outerKeySelector(outer.v), outerValue = outer.v;
            return Create$1.concat(new Stream(Stream.Head, () => create(outer.next(), inner, outerKeySelector, innerKeySelector, resultSelector, equal)), Create$1.Map(innerValue => resultSelector(outerValue, innerValue), Create$1.filter(v => equal(outerKey, innerKeySelector(v)), inner.next())));
        }
    },
    Comparer: function (keySelector, comparer) {
        return (x, y) => comparer(keySelector(x), keySelector(y));
    }
};

exports.Enumerable = Enumerable;
exports.OrderedEnumerable = OrderedEnumerable;
exports.Grouping = Grouping;
exports.Lookup = Lookup;

Object.defineProperty(exports, '__esModule', { value: true });

})));
