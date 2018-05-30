import { IEqual, IPredicate, ISelector, IComparer, TheError, Comparers, Equal, Predicate, Selector, Comparer, ResultSelector, ESType } from './utility'
import { Stream, Create as StreamCreate } from './Stream'
export class Enumerable<T>{
    public readonly GetStream: () => Stream<T>;
    public constructor(s: Stream<T>) {
        this.GetStream = () => s;
    }
    [Symbol.iterator](): Iterator<T> {
        return this.GetStream()[Symbol.iterator]();
    }
    public static CreateFrom<T>(iterable: Iterable<T>): Enumerable<T> {
        return new Enumerable(Stream.CreateFrom(iterable));
    }
    public static Empty<T>(): Enumerable<T> {
        return new Enumerable(Stream.Empty());
    }
    public static Range(start: number, count: number): Enumerable<number> {
        return new Enumerable(new Stream(Stream.Head, () => Create.Range(start, count)));
    }
    public static Repeat<T>(element: T, count: number): Enumerable<T> {
        return new Enumerable(new Stream(Stream.Head, () => Create.Repeat(element, count)));
    }
    public Aggregate(product: (lastResult: T, currentValue: T) => T): T;
    public Aggregate<TAccumulate>(seed: TAccumulate, product: (lastResult: TAccumulate, currentValue: T) => TAccumulate): TAccumulate;
    public Aggregate<TAccumulate, TResult>(seed: TAccumulate, product: (lastResult: TAccumulate, currentValue: T) => TAccumulate, resultSelector: ISelector<TAccumulate, TResult>): TResult;
    public Aggregate(arg0: any, arg1?: any, arg2?: any): any {
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
    public All(predicate: IPredicate<T>): boolean {
        return !this.GetStream().has(v => !predicate(v));
    }
    public Any(predicate: IPredicate<T> = Predicate) {
        return this.GetStream().has(predicate);
    }
    public Average(selector: ISelector<T, number> = Selector): number {
        var i = 0;
        return this.GetStream().reduce((avg, x) => avg += (selector(x) - avg) / (i++ + 1), 0);
    }
    public Cast<TResult>(): Enumerable<TResult> {
        return this as any;
    }
    public Concat(second: Enumerable<T>): Enumerable<T> {
        return new Enumerable(this.GetStream().concat(second.GetStream()));
    }
    public Contains(value: T, equal: IEqual<T> = Equal): boolean {
        return this.GetStream().has(v => equal(value, v));
    }
    public Count(predicate: IPredicate<T> = Predicate): number {
        return this.GetStream().reduce((l, c) => predicate(c) ? l + 1 : l, 0);
    }
    public DefaultIfEmpty(defaultValue: T): Enumerable<T> {
        return new Enumerable(new Stream(Stream.Head, () => {
            var s = this.GetStream().next();
            return Stream.IsEnd(s) ? new Stream(defaultValue, Stream.End) : s;
        }));
    }
    public Distinct(equal: IEqual<T> = Equal): Enumerable<T> {
        return new Enumerable(this.GetStream().distinct(equal));
    }
    public ElementAt(index: number): T {
        return this.GetStream().ref(v => index-- === 0 ? true : false);
    }
    public Except(second: Enumerable<T>, equal: IEqual<T> = Equal): Enumerable<T> {
        return new Enumerable(this.GetStream().except(second.GetStream(), equal));
    }
    public First(predicate: IPredicate<T> = Predicate): T {
        return this.GetStream().ref(predicate);
    }
    public GroupBy<TKey>(keySelector: ISelector<T, TKey>): Enumerable<Grouping<TKey, T>>;
    public GroupBy<TKey>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>): Enumerable<Grouping<TKey, T>>;
    public GroupBy<TKey, TElement>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>, elementSelector: ISelector<T, TElement>): Enumerable<Grouping<TKey, TElement>>;
    public GroupBy<TKey, TElement, TResult>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>, elementSelector: ISelector<T, TElement>, resultSelector: (key: TKey, elements: Enumerable<TElement>) => TResult): Enumerable<TResult>;
    public GroupBy(keySelector: any, equal = Equal, elementSelector = Selector, resultSelector?: any): any {
        var s: Stream<Grouping<any, any>> = new Stream(Stream.Head, () => Create.GroupBy(keySelector, equal, elementSelector, this.GetStream().next()));
        return ESType.function(resultSelector) ? new Enumerable(s.map(v => resultSelector(v.Key, v))) : new Enumerable(s);
    }
    public GroupJoin<TInner, TKey, TResult>(inner: Enumerable<TInner>, outerKeySelector: ISelector<T, TKey>, innerKeySelector: ISelector<TInner, TKey>, resultSelector: (outer: T, inners: Enumerable<TInner>) => TResult, equal: IEqual<TKey> = Equal): Enumerable<TResult> {
        var innerStream = inner.GetStream().cache();
        return new Enumerable(this.GetStream().map(v => {
            var key = outerKeySelector(v);
            return resultSelector(v, new Enumerable(innerStream.filter(v => equal(key, innerKeySelector(v)))));
        }));
    }
    public Intersect(second: Enumerable<T>, equal: IEqual<T> = Equal): Enumerable<T> {
        return new Enumerable(this.GetStream().intersect(second.GetStream(), equal));
    }
    public Join<TInner, TKey, TResult>(inner: Enumerable<TInner>, outerKeySelector: ISelector<T, TKey>, innerKeySelector: ISelector<TInner, TKey>, resultSelector: (outer: T, inner: TInner) => TResult, equal: IEqual<TKey> = Equal): Enumerable<TResult> {
        return new Enumerable(new Stream(Stream.Head, () => Create.Join(this.GetStream().next(), inner.GetStream().cache(), outerKeySelector, innerKeySelector, resultSelector, equal)));
    }
    public Last(predicate: IPredicate<T> = Predicate): T {
        var found = false, result: any;
        this.GetStream().forEach(v => {
            if (predicate(v)) {
                found = true;
                result = v;
            }
        });
        if (found) return result;
        throw TheError.NotFound;
    }
    public Max(comparer: IComparer<T> = Comparer): T {
        return this.GetStream().reduce((l, c) => comparer(l, c) === Comparers['>'] ? l : c);
    }
    public Min(comparer: IComparer<T> = Comparer): T {
        return this.GetStream().reduce((l, c) => comparer(l, c) === Comparers['<'] ? l : c);
    }
    public OrderBy<TKey>(keySelector: ISelector<T, TKey>, comparer: IComparer<TKey> = Comparer): OrderedEnumerable<T> {
        return new OrderedEnumerable(this.GetStream(), Create.Comparer(keySelector, comparer));
    }
    public OrderByDescending<TKey>(keySelector: ISelector<T, TKey>, comparer: IComparer<TKey> = Comparer): OrderedEnumerable<T> {
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
    public Reverse(): Enumerable<T> {
        return new Enumerable(Stream.CreateFrom(this.GetStream().toList().reverse()));
    }
    public Select<TResult>(selector: ISelector<T, TResult>): Enumerable<TResult>;
    public Select<TResult>(selector: (v: T, i: number) => TResult): Enumerable<TResult> {
        var i = 0;
        return new Enumerable(this.GetStream().map(v => selector(v, i++)));
    }
    public SelectMany<TResult>(selector: ISelector<T, Enumerable<TResult>>): Enumerable<TResult>;
    public SelectMany<TResult>(selector: (v: T, i: number) => Enumerable<TResult>): Enumerable<TResult>;
    public SelectMany<TCollection, TResult>(collectionSelector: ISelector<T, Enumerable<TCollection>>, resultSelector: (source: T, collection: TCollection) => TResult): Enumerable<TResult>;
    public SelectMany<TCollection, TResult>(collectionSelector: (v: T, i: number) => Enumerable<TCollection>, resultSelector: (source: T, collection: TCollection) => TResult): Enumerable<TResult>;
    public SelectMany<TCollection, TResult>(collectionSelector: (v: T, i: number) => Enumerable<TCollection>, resultSelector: (source: T, collection: TCollection) => TResult = ResultSelector): Enumerable<TResult> {
        var i = 0;
        return new Enumerable(this.GetStream().map(source => collectionSelector(source, i++).GetStream().map(collection => resultSelector(source, collection))).reduce((l, c) => l.concat(c), Stream.Empty<TResult>()));
    }
    public SequenceEqual(second: Enumerable<T>, equal: IEqual<T> = Equal): boolean {
        return this.GetStream().equal(second.GetStream(), equal);
    }
    public Single(predicate: IPredicate<T> = Predicate): T {
        var found = false, result: any;
        this.GetStream().forEach(v => {
            if (predicate(v)) {
                if (found) throw TheError.NotSingle;
                found = true;
                result = v;
            }
        });
        if (found) return result;
        throw TheError.NotFound;
    }
    public Skip(count: number): Enumerable<T> {
        return new Enumerable(this.GetStream().skip(v => count-- !== 0));
    }
    public SkipWhile(predicate: IPredicate<T>): Enumerable<T>;
    public SkipWhile(predicate: (v: T, i: number) => boolean): Enumerable<T> {
        var i = 0;
        return new Enumerable(this.GetStream().skip(v => predicate(v, i++)));
    }
    public Sum(selector: ISelector<T, number> = Selector): number {
        return this.GetStream().reduce((sum, x) => sum + selector(x), 0);
    }
    public Take(count: number): Enumerable<T> {
        return new Enumerable(this.GetStream().take(v => count-- !== 0));
    }
    public TakeWhile(predicate: IPredicate<T>): Enumerable<T>;
    public TakeWhile(predicate: (v: T, i: number) => boolean): Enumerable<T> {
        var i = 0;
        return new Enumerable(this.GetStream().take(v => predicate(v, i++)));
    }
    public ToDictionary<TKey>(keySelector: ISelector<T, TKey>): Map<TKey, T>;
    public ToDictionary<TKey>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>): Map<TKey, T>;
    public ToDictionary<TKey, TElement>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>, elementSelector: ISelector<T, TElement>): Map<TKey, TElement>;
    public ToDictionary<TKey, TElement>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey> = Equal, elementSelector: ISelector<T, TElement> = Selector): Map<TKey, TElement> {
        return this.GetStream().reduce((l, c) => {
            var key = keySelector(c);
            for (var k of l.keys()) {
                if (equal(key, k)) throw TheError.KeyRepeat;
            }
            l.set(key, elementSelector(c));
            return l;
        }, new Map<TKey, TElement>());
    }
    public ToList(): T[] {
        return this.GetStream().toList();
    }
    public ToLookup<TKey>(keySelector: ISelector<T, TKey>): Lookup<TKey, T>;
    public ToLookup<TKey>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>): Lookup<TKey, T>;
    public ToLookup<TKey, TElement>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>, elementSelector: ISelector<T, TElement>): Lookup<TKey, TElement>;
    public ToLookup<TKey, TElement>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey> = Equal, elementSelector: ISelector<T, TElement> = Selector): Lookup<TKey, TElement> {
        return new Lookup(this.GroupBy(keySelector, equal, elementSelector).GetStream());
    }
    public Union(second: Enumerable<T>, equal: IEqual<T> = Equal): Enumerable<T> {
        return new Enumerable(this.GetStream().union(second.GetStream(), equal));
    }
    public Where(predicate: IPredicate<T>): Enumerable<T>;
    public Where(predicate: (v: T, i: number) => boolean): Enumerable<T> {
        var i = 0;
        return new Enumerable(this.GetStream().filter(v => predicate(v, i++)));
    }
    public Zip<TSecond, TResult>(second: Enumerable<TSecond>, resultSelector: (first: T, second: TSecond) => TResult): Enumerable<TResult> {
        return new Enumerable(Stream.Map(resultSelector, this.GetStream(), second.GetStream()));
    }
}
export class OrderedEnumerable<T> extends Enumerable<T>{
    public constructor(s: Stream<T>, comparer: IComparer<T>) {
        super(s.sort(comparer));
        this.ThenBy = (ks, cp = Comparer) => {
            return new OrderedEnumerable(s, (x, y) => {
                var last = comparer(x, y);
                if (last === Comparers['=']) {
                    return cp(ks(x), ks(y));
                }
                return last
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
                return last
            });
        };
    }
    public readonly ThenBy: <TKey>(keySelector: ISelector<T, TKey>, comparer?: IComparer<TKey>) => OrderedEnumerable<T>;
    public readonly ThenByDescending: <TKey>(keySelector: ISelector<T, TKey>, comparer?: IComparer<TKey>) => OrderedEnumerable<T>;
}
export class Grouping<TKey, TElement> extends Enumerable<TElement>{
    public readonly Key: TKey;
    public constructor(key: TKey, elements: Stream<TElement>) {
        super(elements);
        this.Key = key;
    }
}
export class Lookup<TKey, TElement> extends Enumerable<Grouping<TKey, TElement>>{
    public constructor(s: Stream<Grouping<TKey, TElement>>) {
        super(s.cache());
    }
    public Get(key: TKey): Enumerable<TElement> {
        return this.First(v => v.Key === key);
    }
    public ContainsKey(key: TKey): boolean {
        return this.Any(v => v.Key === key);
    }
}
const Create = {
    Range: function create(start: number, count: number): Stream<number> {
        return count === 0 ? Stream.End : new Stream(start, () => create(start + 1, count - 1));
    },
    Repeat: function create<T>(element: T, count: number): Stream<T> {
        return count === 0 ? Stream.End : new Stream(element, () => create(element, count - 1));
    },
    GroupBy: function create<T, TKey, TElement>(keySelector: ISelector<T, TKey>, equal: IEqual<TKey>, elementSelector: ISelector<T, TElement>, s: Stream<T>): Stream<Grouping<TKey, TElement>> {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            var key = keySelector(s.v), value = elementSelector(s.v);
            var [result, rest] = s.shunt(v => equal(key, keySelector(v)));
            return new Stream(
                new Grouping(key, Stream.Create(value, () => StreamCreate.Map(elementSelector, result.next()))),
                () => create(keySelector, equal, elementSelector, rest.next()));
        }
    },
    Join: function create<TOuter, TInner, TKey, TResult>(outer: Stream<TOuter>, inner: Stream<TInner>, outerKeySelector: ISelector<TOuter, TKey>, innerKeySelector: ISelector<TInner, TKey>, resultSelector: (outer: TOuter, inner: TInner) => TResult, equal: IEqual<TKey>): Stream<TResult> {
        if (Stream.IsEnd(outer)) {
            return Stream.End;
        }
        else {
            var outerKey = outerKeySelector(outer.v), outerValue = outer.v;
            return StreamCreate.concat(
                new Stream(Stream.Head, () => create(outer.next(), inner, outerKeySelector, innerKeySelector, resultSelector, equal)),
                StreamCreate.Map(
                    innerValue => resultSelector(outerValue, innerValue),
                    StreamCreate.filter(v => equal(outerKey, innerKeySelector(v)), inner.next())));
        }
    },
    Comparer: function <T, Tkey>(keySelector: ISelector<T, Tkey>, comparer: IComparer<Tkey>): IComparer<T> {
        return (x, y) => comparer(keySelector(x), keySelector(y));
    }
};