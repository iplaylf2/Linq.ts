enum Exception {
    NotFound = 'NotFound'
}
enum Comparers {
    ['<'] = -1, ['='] = 0, ['>'] = 1
}
type IEqual<T> = (x: T, y: T) => boolean;
type IPredicate<T> = (v: T) => boolean;
type ISelector<TSource, TResult> = (v: TSource) => TResult;
type IComparer<T> = (x: T, y: T) => Comparers;
export class Stream<T>{
    public readonly v: T;
    public readonly next: () => Stream<T>;
    public constructor(v: T, next: () => Stream<T>) {
        this.v = v;
        this.next = next;
    }
    [Symbol.iterator](): Iterator<T> {
        var s: Stream<T> = this;
        return {
            next: () => {
                s = s.next();
                if (Stream.IsEnd(s)) return { value: <any>undefined, done: true };
                else return { value: s.v, done: false };
            }
        };
    }
    public static Head: any;
    public static End: any;
    public static IsEnd<T>(s: Stream<T>): boolean {
        return s === Stream.End;
    }
    public static Map<TSource, TResult>(func: (...vList: TSource[]) => TResult, ...sList: Stream<TSource>[]): Stream<TResult> {
        return new Stream(Stream.Head, () => Create.Map(func, sList.map(s => s.next())));
    }
    public static CreateFrom<T>(iterable: Iterable<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.CreateFrom(iterable[Symbol.iterator]()));
    }
    public static Empty<T>(): Stream<T> {
        return new Stream(Stream.Head, () => Stream.End);
    }
    /*prototype*/
    public forEach(action: (v: T) => void): void {
        var s = this.next();
        while (!Stream.IsEnd(s)) {
            action(s.v);
            s = s.next();
        }
    }
    public toArray(): T[] {
        var arr: T[] = [];
        this.forEach(v => arr.push(v));
        return arr;
    }
    public reduce<TResult>(product: (lastResult: TResult, currentValue: T) => TResult, initial?: TResult): TResult {
        var result: TResult, s: Stream<T> = this;
        if (initial === undefined) {
            s = s.next();
            result = <any>s.v;
        }
        else {
            result = initial;
        }
        s.forEach(v => {
            result = product(result, v);
        });
        return result;
    }
    public equal(second: Stream<T>, equal: IEqual<T>): boolean {
        var first: Stream<T> = this,
            a: boolean, b: boolean;
        do {
            first = first.next();
            second = second.next();
            a = Stream.IsEnd(first);
            b = Stream.IsEnd(second);
            if (a !== b) return false;
            else if (a) return true;
            else if (!equal(first.v, second.v)) return false;
        } while (true);
    }
    public ref(i: number): T {
        var s = this.next();
        while (i !== 0) {
            s = this.next();
            i--;
        };
        return s.v;
    }
    public indexOf(predicate: IPredicate<T>): number {
        var s = this.next(), i = 0;
        while (!Stream.IsEnd(s)) {
            if (predicate(s.v)) return i;
            i++;
            s = s.next();
        }
        throw Exception.NotFound;
    }
    public shunt(predicate: IPredicate<T>): [Stream<T>, Stream<T>] {
        var arr1: T[] = [], arr2: T[] = [], o: { s: Stream<T> } = { s: this }, flag = true;
        return [new Stream(Stream.Head, () => {
            if (flag) {
                o.s = o.s.next();
                flag = false;
            }
            return Create.shunt(predicate, arr1, arr2, o, 0);
        }),
        new Stream(Stream.Head, () => {
            if (flag) {
                o.s = o.s.next();
                flag = false;
            }
            return Create.shunt(v => !predicate(v), arr2, arr1, o, 0)
        })];
    }
    /*lazy*/
    public map<TResult>(func: ISelector<T, TResult>): Stream<TResult> {
        return Stream.Map(func, this);
    }
    public filter(predicate: IPredicate<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.filter(predicate, this.next()));
    }
    public concat(second: Stream<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.concat(second, this.next()));
    }
    public sort(comparer: IComparer<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.sort(comparer, this.next()));
    }
    public distinct(equal: IEqual<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.distinct(equal, this.next()));
    }
    public union(second: Stream<T>, equal: IEqual<T>): Stream<T> {
        return this.concat(second).distinct(equal);
    }
    public intersect(second: Stream<T>, equal: IEqual<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.intersect(equal,
            this.distinct(equal).next(),
            second.distinct(equal)));
    }
    public except(second: Stream<T>, equal: IEqual<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.except(equal,
            this.distinct(equal).next(),
            second.distinct(equal)));
    }
    public skip(predicate: IPredicate<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.skip(predicate, this.next()));
    }
    public take(predicate: IPredicate<T>): Stream<T> {
        return new Stream(Stream.Head, () => Create.take(predicate, this.next()));
    }
    public cache(): Stream<T> {
        var next: Stream<T>;
        return new Stream(Stream.Head, () => {
            if (next === undefined) next = Create.cache(this.next());
            return next;
        });
    }
}
const Create = {
    Map: function create<TSource, TResult>(func: (...vList: TSource[]) => TResult, sList: Stream<TSource>[]): Stream<TResult> {
        if (Stream.IsEnd(sList[0])) return Stream.End;
        else return new Stream(func(...sList.map(s => s.v)), () => create(func, sList.map(s => s.next())));
    },
    CreateFrom: function create<T>(iterator: Iterator<T>): Stream<T> {
        var result = iterator.next();
        if (result.done) return Stream.End;
        else return new Stream(result.value, () => create(iterator));
    },
    shunt: function create<T>(predicate: IPredicate<T>, useful: T[], useless: T[], o: { s: Stream<T> }, i: number): Stream<T> {
        if (useful.length > i) {
            return new Stream(useful[i], () => create(predicate, useful, useless, o, i + 1));
        }
        else {
            if (Stream.IsEnd(o.s)) {
                return Stream.End;
            }
            else {
                if (predicate(o.s.v)) {
                    useful.push(o.s.v);
                    o.s = o.s.next();
                    return new Stream(useful[i], () => create(predicate, useful, useless, o, i + 1));
                }
                else {
                    useless.push(o.s.v)
                    o.s = o.s.next();
                    return create(predicate, useful, useless, o, i);
                }
            }
        }
    },
    filter: function create<T>(predicate: IPredicate<T>, s: Stream<T>): Stream<T> {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            if (predicate(s.v)) return new Stream(s.v, () => create(predicate, s.next()));
            else return create(predicate, s.next());
        }
    },
    concat: function create<T>(second: Stream<T>, first: Stream<T>): Stream<T> {
        if (Stream.IsEnd(first)) return second.next();
        else return new Stream(first.v, () => create(second, first.next()));
    },
    sort: function <T>(comparer: IComparer<T>, s: Stream<T>): Stream<T> {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            var [s1, s2] = s.shunt(v => comparer(s.v, v) === Comparers['>']);
            return s1.sort(comparer)
                .concat(new Stream(Stream.Head, () => new Stream(s.v, () => Stream.End)))
                .concat(s2.sort(comparer))
                .next();
        }
    },
    distinct: function create<T>(equal: IEqual<T>, s: Stream<T>): Stream<T> {
        if (Stream.IsEnd(s)) return Stream.End;
        else return new Stream(s.v, () => create(equal, s.filter(v => !equal(s.v, v)).next()));
    },
    intersect: function create<T>(equal: IEqual<T>, first: Stream<T>, second: Stream<T>): Stream<T> {
        if (Stream.IsEnd(first)) {
            return Stream.End;
        }
        else {
            var [eq, neq] = second.shunt(v => equal(first.v, v));
            if (Stream.IsEnd(eq.next())) return create(equal, first.next(), neq);
            else return new Stream(first.v, () => create(equal, first.next(), neq));
        }
    },
    except: function create<T>(equal: IEqual<T>, first: Stream<T>, second: Stream<T>): Stream<T> {
        if (Stream.IsEnd(first)) {
            return second.next();
        }
        else {
            var [eq, neq] = second.shunt(v => equal(first.v, v));
            if (Stream.IsEnd(eq.next())) return new Stream(first.v, () => create(equal, first.next(), neq));
            else return create(equal, first.next(), neq);
        }
    },
    skip: function create<T>(predicate: IPredicate<T>, s: Stream<T>): Stream<T> {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            if (predicate(s.v)) return create(predicate, s.next());
            else return s;
        }
    },
    take: function create<T>(predicate: IPredicate<T>, s: Stream<T>): Stream<T> {
        if (Stream.IsEnd(s)) {
            return Stream.End;
        }
        else {
            if (predicate(s.v)) return new Stream(s.v, () => create(predicate, s.next()));
            else return Stream.End;
        }
    },
    cache: function create<T>(s: Stream<T>): Stream<T> {
        if (Stream.IsEnd(s)) {
            return Stream.End
        }
        else {
            var next: Stream<T>;
            return new Stream(s.v, () => {
                if (next === undefined) next = create(s.next());
                return next;
            });
        }
    }
};