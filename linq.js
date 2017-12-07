"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
const Stream_1 = require("./Stream");
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
        if (utility_1.ESType.function(arg0) && utility_1.ESType.undefined(arg1) && utility_1.ESType.undefined(arg2)) {
            return this.GetStream().reduce(arg0);
        }
        if (utility_1.ESType.any(arg0) && utility_1.ESType.function(arg1) && utility_1.ESType.undefined(arg2)) {
            return this.GetStream().reduce(arg1, arg0);
        }
        if (utility_1.ESType.any(arg0) && utility_1.ESType.function(arg1) && utility_1.ESType.function(arg2)) {
            return arg2(this.GetStream().reduce(arg1, arg0));
        }
        throw utility_1.TheError.ArgumentError;
    }
    All(predicate) {
        return !this.GetStream().has(v => !predicate(v));
    }
    Any(predicate = utility_1.Predicate) {
        return this.GetStream().has(predicate);
    }
    Average(selector = utility_1.Selector) {
        var i = 0;
        return this.GetStream().reduce((avg, x) => avg += (selector(x) - avg) / (i++ + 1), 0);
    }
    Concat(second) {
        return new Enumerable(this.GetStream().concat(second.GetStream()));
    }
    Contains(value, equal = utility_1.Equal) {
        return this.GetStream().has(v => equal(value, v));
    }
    Count(predicate = utility_1.Predicate) {
        return this.GetStream().reduce((l, c) => predicate(c) ? l + 1 : l, 0);
    }
    DefaultIfEmpty(defaultValue) {
        return new Enumerable(new Stream_1.Stream(Stream_1.Stream.Head, () => {
            var s = this.GetStream().next();
            return Stream_1.Stream.IsEnd(s) ? new Stream_1.Stream(defaultValue, Stream_1.Stream.End) : s;
        }));
    }
    Distinct(equal = utility_1.Equal) {
        return new Enumerable(this.GetStream().distinct(equal));
    }
    ElementAt(index) {
        return this.GetStream().ref(v => index-- === 0 ? true : false);
    }
    Except(second, equal = utility_1.Equal) {
        return new Enumerable(this.GetStream().except(second.GetStream(), equal));
    }
    First(predicate = utility_1.Predicate) {
        return this.GetStream().ref(predicate);
    }
    GroupBy(keySelector, equal = utility_1.Equal, elementSelector = utility_1.Selector, resultSelector) {
        var s = new Stream_1.Stream(Stream_1.Stream.Head, () => Create.GroupBy(keySelector, equal, elementSelector, this.GetStream().next()));
        return utility_1.ESType.function(resultSelector) ? new Enumerable(s.map(v => resultSelector(v.Key, v))) : new Enumerable(s);
    }
    GroupJoin(inner, outerKeySelector, innerKeySelector, resultSelector, equal = utility_1.Equal) {
        var innerStream = inner.GetStream().cache();
        return new Enumerable(this.GetStream().map(v => {
            var key = outerKeySelector(v);
            return resultSelector(v, new Enumerable(innerStream.filter(v => equal(key, innerKeySelector(v)))));
        }));
    }
    Intersect(second, equal = utility_1.Equal) {
        return new Enumerable(this.GetStream().intersect(second.GetStream(), equal));
    }
    Join(inner, outerKeySelector, innerKeySelector, resultSelector, equal = utility_1.Equal) {
        return new Enumerable(new Stream_1.Stream(Stream_1.Stream.Head, () => Create.Join(this.GetStream().next(), inner.GetStream().cache(), outerKeySelector, innerKeySelector, resultSelector, equal)));
    }
    Last(predicate = utility_1.Predicate) {
        var found = false, result;
        this.GetStream().forEach(v => {
            if (predicate(v)) {
                found = true;
                result = v;
            }
        });
        if (found)
            return result;
        throw utility_1.TheError.NotFound;
    }
    Max(comparer = utility_1.Comparer) {
        return this.GetStream().reduce((l, c) => comparer(l, c) === utility_1.Comparers['>'] ? l : c);
    }
    Min(comparer = utility_1.Comparer) {
        return this.GetStream().reduce((l, c) => comparer(l, c) === utility_1.Comparers['<'] ? l : c);
    }
    OrderBy(keySelector, comparer = utility_1.Comparer) {
        return new OrderedEnumerable(this.GetStream(), Create.Comparer(keySelector, comparer));
    }
    OrderByDescending(keySelector, comparer = utility_1.Comparer) {
        return new OrderedEnumerable(this.GetStream(), Create.Comparer(keySelector, (x, y) => {
            switch (comparer(x, y)) {
                case utility_1.Comparers['<']:
                    return utility_1.Comparers['>'];
                case utility_1.Comparers['>']:
                    return utility_1.Comparers['<'];
                case utility_1.Comparers['=']:
                    return utility_1.Comparers['='];
                default:
                    throw utility_1.TheError.Never;
            }
        }));
    }
    Reverse() {
        return new Enumerable(Stream_1.Stream.CreateFrom(this.GetStream().toList().reverse()));
    }
    Select(selector) {
        var i = 0;
        return new Enumerable(this.GetStream().map(v => selector(v, i++)));
    }
    SelectMany(collectionSelector, resultSelector = utility_1.ResultSelector) {
        var i = 0;
        return new Enumerable(this.GetStream().map(source => collectionSelector(source, i++).GetStream().map(collection => resultSelector(source, collection))).reduce((l, c) => l.concat(c), Stream_1.Stream.Empty()));
    }
    SequenceEqual(second, equal = utility_1.Equal) {
        return this.GetStream().equal(second.GetStream(), equal);
    }
    Single(predicate = utility_1.Predicate) {
        var found = false, result;
        this.GetStream().forEach(v => {
            if (predicate(v)) {
                if (found)
                    throw utility_1.TheError.NotSingle;
                found = true;
                result = v;
            }
        });
        if (found)
            return result;
        throw utility_1.TheError.NotFound;
    }
    Skip(count) {
        return new Enumerable(this.GetStream().skip(v => count-- !== 0));
    }
    SkipWhile(predicate) {
        var i = 0;
        return new Enumerable(this.GetStream().skip(v => predicate(v, i++)));
    }
    Sum(selector = utility_1.Selector) {
        return this.GetStream().reduce((sum, x) => sum + selector(x), 0);
    }
    Take(count) {
        return new Enumerable(this.GetStream().take(v => count-- !== 0));
    }
    TakeWhile(predicate) {
        var i = 0;
        return new Enumerable(this.GetStream().take(v => predicate(v, i++)));
    }
    ToDictionary(keySelector, equal = utility_1.Equal, elementSelector = utility_1.Selector) {
        return this.GetStream().reduce((l, c) => {
            var key = keySelector(c);
            for (var k of l.keys()) {
                if (equal(key, k))
                    throw utility_1.TheError.KeyRepeat;
            }
            l.set(key, elementSelector(c));
            return l;
        }, new Map());
    }
    ToList() {
        return this.GetStream().toList();
    }
    ToLookup(keySelector, equal = utility_1.Equal, elementSelector = utility_1.Selector) {
        return new Lookup(this.GroupBy(keySelector, equal, elementSelector).GetStream());
    }
    Union(second, equal = utility_1.Equal) {
        return new Enumerable(this.GetStream().union(second.GetStream(), equal));
    }
    Where(predicate) {
        var i = 0;
        return new Enumerable(this.GetStream().filter(v => predicate(v, i++)));
    }
    Zip(second, resultSelector) {
        return new Enumerable(Stream_1.Stream.Map(resultSelector, this.GetStream(), second.GetStream()));
    }
}
exports.Enumerable = Enumerable;
class OrderedEnumerable extends Enumerable {
    constructor(s, comparer) {
        super(s.sort(comparer));
        this.ThenBy = (ks, cp = utility_1.Comparer) => {
            return new OrderedEnumerable(s, (x, y) => {
                var last = comparer(x, y);
                if (last === utility_1.Comparers['=']) {
                    return cp(ks(x), ks(y));
                }
                return last;
            });
        };
        this.ThenByDescending = (ks, cp = utility_1.Comparer) => {
            return new OrderedEnumerable(s, (x, y) => {
                var last = comparer(x, y);
                if (last === utility_1.Comparers['=']) {
                    switch (cp(ks(x), ks(y))) {
                        case utility_1.Comparers['<']:
                            return utility_1.Comparers['>'];
                        case utility_1.Comparers['>']:
                            return utility_1.Comparers['<'];
                        case utility_1.Comparers['=']:
                            return utility_1.Comparers['='];
                        default:
                            throw utility_1.TheError.Never;
                    }
                }
                return last;
            });
        };
    }
}
exports.OrderedEnumerable = OrderedEnumerable;
class Grouping extends Enumerable {
    constructor(key, elements) {
        super(elements);
        this.Key = key;
    }
}
exports.Grouping = Grouping;
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
exports.Lookup = Lookup;
const Create = {
    Range: function create(start, count) {
        return count === 0 ? Stream_1.Stream.End : new Stream_1.Stream(start, () => create(start + 1, count - 1));
    },
    Repeat: function create(element, count) {
        return count === 0 ? Stream_1.Stream.End : new Stream_1.Stream(element, () => create(element, count - 1));
    },
    GroupBy: function create(keySelector, equal, elementSelector, s) {
        if (Stream_1.Stream.IsEnd(s)) {
            return Stream_1.Stream.End;
        }
        else {
            var key = keySelector(s.v), value = elementSelector(s.v);
            var [result, rest] = s.shunt(v => equal(key, keySelector(v)));
            return new Stream_1.Stream(new Grouping(key, Stream_1.Stream.Create(value, () => Stream_1.Create.Map(elementSelector, result.next()))), () => create(keySelector, equal, elementSelector, rest.next()));
        }
    },
    Join: function create(outer, inner, outerKeySelector, innerKeySelector, resultSelector, equal) {
        if (Stream_1.Stream.IsEnd(outer)) {
            return Stream_1.Stream.End;
        }
        else {
            var outerKey = outerKeySelector(outer.v), outerValue = outer.v;
            return Stream_1.Create.concat(new Stream_1.Stream(Stream_1.Stream.Head, () => create(outer.next(), inner, outerKeySelector, innerKeySelector, resultSelector, equal)), Stream_1.Create.Map(innerValue => resultSelector(outerValue, innerValue), Stream_1.Create.filter(v => equal(outerKey, innerKeySelector(v)), inner.next())));
        }
    },
    Comparer: function (keySelector, comparer) {
        return (x, y) => comparer(keySelector(x), keySelector(y));
    }
};
