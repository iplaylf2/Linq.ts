"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
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
        return new Stream(Stream.Head, () => Create.Map(func, sList.map(s => s.next())));
    }
    static CreateFrom(iterable) {
        return new Stream(Stream.Head, () => Create.CreateFrom(iterable[Symbol.iterator]()));
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
        throw utility_1.TheError.NotFound;
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
        var arr1 = [], arr2 = [], o = { s: this }, flag = true;
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
                return Create.shunt(v => !predicate(v), arr2, arr1, o, 0);
            })];
    }
    /*lazy*/
    map(func) {
        return Stream.Map(func, this);
    }
    filter(predicate) {
        return new Stream(Stream.Head, () => Create.filter(predicate, this.next()));
    }
    concat(second) {
        return new Stream(Stream.Head, () => Create.concat(second, this.next()));
    }
    sort(comparer) {
        return new Stream(Stream.Head, () => Create.sort(comparer, this.next()));
    }
    distinct(equal) {
        return new Stream(Stream.Head, () => Create.distinct(equal, this.next()));
    }
    union(second, equal) {
        return this.concat(second).distinct(equal);
    }
    intersect(second, equal) {
        return new Stream(Stream.Head, () => Create.intersect(equal, this.distinct(equal).next(), second.distinct(equal)));
    }
    except(second, equal) {
        return new Stream(Stream.Head, () => Create.except(equal, this.distinct(equal).next(), second.distinct(equal)));
    }
    skip(predicate) {
        return new Stream(Stream.Head, () => Create.skip(predicate, this.next()));
    }
    take(predicate) {
        return new Stream(Stream.Head, () => Create.take(predicate, this.next()));
    }
    cache() {
        var next, flag = true;
        return new Stream(Stream.Head, () => {
            if (flag) {
                next = Create.cache(this.next());
                flag = false;
            }
            ;
            return next;
        });
    }
}
exports.Stream = Stream;
const Create = {
    Map: function create(func, sList) {
        return Stream.IsEnd(sList[0]) ? Stream.End : new Stream(func(...sList.map(s => s.v)), () => create(func, sList.map(s => s.next())));
    },
    CreateFrom: function create(iterator) {
        var result = iterator.next();
        return result.done ? Stream.End : new Stream(result.value, () => create(iterator));
    },
    shunt: function create(predicate, useful, useless, o, i) {
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
                    useless.push(o.s.v);
                    o.s = o.s.next();
                    return create(predicate, useful, useless, o, i);
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
            var [s1, s2] = s.shunt(v => comparer(s.v, v) === utility_1.Comparers['>']);
            return s1.sort(comparer)
                .concat(Stream.Create(s.v, () => Stream.End))
                .concat(s2.sort(comparer))
                .next();
        }
    },
    distinct: function create(equal, s) {
        return Stream.IsEnd(s) ? Stream.End : new Stream(s.v, () => create(equal, s.filter(v => !equal(s.v, v)).next()));
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
            return second.next();
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
