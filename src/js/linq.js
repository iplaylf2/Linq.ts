import { TheError, Comparers, Equal, Predicate, Selector, Comparer, ResultSelector, ESType } from './utility';
import { Stream, Create as StreamCreate } from './Stream';
export class Enumerable {
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
        return new Enumerable(new Stream(Stream.Head, () => Create.Range(start, count)));
    }
    static Repeat(element, count) {
        return new Enumerable(new Stream(Stream.Head, () => Create.Repeat(element, count)));
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
        var s = new Stream(Stream.Head, () => Create.GroupBy(keySelector, equal, elementSelector, this.GetStream().next()));
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
        return new Enumerable(new Stream(Stream.Head, () => Create.Join(this.GetStream().next(), inner.GetStream().cache(), outerKeySelector, innerKeySelector, resultSelector, equal)));
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
        return new OrderedEnumerable(this.GetStream(), Create.Comparer(keySelector, comparer));
    }
    OrderByDescending(keySelector, comparer = Comparer) {
        return new OrderedEnumerable(this.GetStream(), Create.Comparer(keySelector, (x, y) => {
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
export class OrderedEnumerable extends Enumerable {
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
export class Grouping extends Enumerable {
    constructor(key, elements) {
        super(elements);
        this.Key = key;
    }
}
export class Lookup extends Enumerable {
    constructor(s) {
        super(s.cache());
    }
    Get(key) {
        return this.First(v => v.Key === key);
    }
    ContainsKey(key) {
        return this.Any(v => v.Key === key);
    }
}
const Create = {
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
            return new Stream(new Grouping(key, Stream.Create(value, () => StreamCreate.Map(elementSelector, result.next()))), () => create(keySelector, equal, elementSelector, rest.next()));
        }
    },
    Join: function create(outer, inner, outerKeySelector, innerKeySelector, resultSelector, equal) {
        if (Stream.IsEnd(outer)) {
            return Stream.End;
        }
        else {
            var outerKey = outerKeySelector(outer.v), outerValue = outer.v;
            return StreamCreate.concat(new Stream(Stream.Head, () => create(outer.next(), inner, outerKeySelector, innerKeySelector, resultSelector, equal)), StreamCreate.Map(innerValue => resultSelector(outerValue, innerValue), StreamCreate.filter(v => equal(outerKey, innerKeySelector(v)), inner.next())));
        }
    },
    Comparer: function (keySelector, comparer) {
        return (x, y) => comparer(keySelector(x), keySelector(y));
    }
};
