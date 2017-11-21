(function (_export) {
    var Type = {
        undefined: typeof undefined,
        boolean: typeof Boolean(),
        number: typeof Number(),
        string: typeof String(),
        object: typeof Object(),
        function: typeof Function(),
        Type: typeof (typeof Object())
    };

    var Predicate = function () {
        return true;
    };

    var Equal = function (x, y) {
        return x === y;
    };

    var Comparer = function (x, y) {
        if (x < y) {
            return -1;
        }
        else if (x === y) {
            return 0;
        }
        else if (x > y) {
            return 1;
        }
    };

    if (window.Symbol === undefined) {
        Symbol = { iterator: 'iterator*' }
    }

    var Iterator = (function () {
        var Iterator = function (next) {
            if (typeof next === Type.function) {
                this.next = next;
            }
        };

        Iterator.Done = function () { return { value: undefined, done: true } };
        Iterator.Next = function (value) { return { value: value, done: false } };
        Iterator.Cons = function (first, rest) {
            return function () {
                var result = first();
                this.next = function () {
                    this.next = rest();
                    return this.next();
                };
                return result;
            }
        };

        Iterator.prototype = {
            next: Iterator.Done
        };

        Iterator.FromIndexr = function (src) {
            if (typeof src[Symbol.iterator] === Type.function) {
                return src[Symbol.iterator]();
            }
            else {
                var index = 0;

                return new Iterator(function () {
                    if (index === src.length) {
                        this.next = Iterator.Done;
                        return this.next();
                    }
                    var obj = Iterator.Next(src[index]);
                    index++;
                    return obj
                });
            }
        };
        Iterator.FromObject = function (obj) {
            var keys = Object.keys(obj);
            var index = 0;

            return new Iterator(function () {
                if (index === keys.length) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                var key = keys[index];
                var res = { key: key, value: obj[key] };
                index++;
                return Iterator.Next(res);
            });
        };

        Iterator.Range = function (start, count) {
            var value = start,
                index = 0;

            return new Iterator(function () {
                var v = value;
                if (index === count) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    value++;
                    index++;
                }
                return Iterator.Next(v);
            });
        };
        Iterator.Repeat = function (element, count) {
            var index = 0;
            return new Iterator(function () {
                if (index === count) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    index++;
                }
                return Iterator.Next(element);
            });
        };

        Iterator.forEach = function (iterator, action) {
            for (var index = 0, obj = iterator.next() ; !obj.done; index++, obj = iterator.next()) {
                var con = action(obj.value, index);
                if (con === false) break;
            }
        };
        Iterator.indexOf = function (iterator, item, comparer) {
            var result = -1;
            Iterator.forEach(iterator, function (v, i) {
                if (comparer(item, v)) {
                    result = i;
                    return false;
                }
            });
            return result;
        };
        Iterator.ref = function (iterator, index) {
            var result;
            Iterator.forEach(iterator, function (v, i) {
                if (index === i) {
                    result = v;
                    return false;
                }
            });
            return result;
        };
        Iterator.reduce = function (iterator, produce, result) {
            Iterator.forEach(iterator, function (v, i) {
                result = produce(result, v, i);
            });
            return result;
        };
        Iterator.sequenceEqual = function (first, second, comparer) {
            for (var obj1 = first.next(), obj2 = second.next() ; !obj1.done && !obj2.done; obj1 = first.next(), obj2 = second.next()) {
                if (!comparer(obj1.value, obj2.value)) {
                    return false;
                }
            }
            return obj1.done === obj2.done;
        };

        Iterator.toArray = function (iterator) {
            var arr = [];
            Iterator.forEach(iterator, function (v) {
                arr.push(v);
            });
            return arr;
        };
        Iterator.map = function () {
            var argus = arguments,
                action = arguments[0];
            return function () {
                for (var arr = [], i = 1; i !== argus.length; i++) {
                    var obj = argus[i].next();
                    if (obj.done) {
                        this.next = Iterator.Done;
                        return this.next();
                    }
                    arr.push(obj.value);
                }
                return Iterator.Next(action.apply(undefined, arr));
            };
        };
        Iterator.filter = function (iterator, predicate) {
            var index = 0;
            return function () {
                var obj = iterator.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    var access = predicate(obj.value, index);
                    index++;
                    if (access) {
                        return obj;
                    }
                    else {
                        return this.next();
                    }
                }
            };
        };
        Iterator.getNext = function (iterator) {
            return function () {
                var obj = iterator.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    return obj;
                }
            };
        };
        Iterator.concat = function (first, second) {
            return function () {
                var obj = first.next();
                if (obj.done) {
                    this.next = Iterator.getNext(second);
                    return this.next();
                }
                else {
                    return obj;
                }
            };
        };
        Iterator.unshift = function (iterator, value) {
            var tmp = iterator.next;
            iterator.next = Iterator.Cons(function () {
                return Iterator.Next(value);
            }, function () {
                return tmp;
            });
            return iterator;
        };
        Iterator.shunt = function (iterator, predicate) {
            var index = 0;

            var more = function (expect) {
                var obj = iterator.next();
                if (obj.done) {
                    return false
                }
                else {
                    var res = predicate(obj.value, index);
                    index++;
                    if (res === true) {
                        Iterator.unshift(s1, obj.value);
                    }
                    else {
                        Iterator.unshift(s2, obj.value);
                    }

                    if (res === expect) {
                        return true;
                    }
                    else {
                        return more(expect);
                    }
                }
            };

            var bulidNext = function (src, expect) {
                return function () {
                    var obj = src.next();
                    if (obj.done) {
                        if (more(expect)) {
                            return src.next();
                        }
                        else {
                            this.next = Iterator.Done;
                            return this.next();
                        }
                    }
                    else {
                        return obj;
                    }
                };
            }
            var s1 = new Iterator(),
                s2 = new Iterator(),
                i1 = new Iterator(bulidNext(s1, true)),
                i2 = new Iterator(bulidNext(s2, false));
            return [i1, i2];
        };
        Iterator.sort = function (iterator, comparer) {
            var obj;
            var iters;
            var getIter = function () {
                obj = iterator.next();
                if (!obj.done) {
                    iters = Iterator.shunt(iterator, function (v) {
                        return comparer(v, obj.value) < 0;
                    });
                }
                getIter = function () { return !obj.done; };
                return getIter();
            };
            var i1 = new Iterator(function () {
                if (getIter()) {
                    this.next = Iterator.sort(iters[0], comparer);
                }
                else {
                    this.next = Iterator.Done;
                }
                return this.next();
            });
            var i2 = new Iterator(function () {
                this.next = Iterator.Cons(function () { return obj; }, function () {
                    if (getIter()) {
                        return Iterator.sort(iters[1], comparer);
                    }
                    else {
                        return Iterator.Done;
                    }
                });
                return this.next();
            })
            return Iterator.concat(i1, i2);
        };
        Iterator.reverse = function (iterator) {
            var arr = Iterator.toArray(iterator);
            return function () {
                if (arr.length === 0) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    return Iterator.Next(arr.pop());
                }
            };
        };
        Iterator.reuse = function (iterator) {
            var arr = [];
            var next = function () {
                var index = 0;
                this.next = function () {
                    if (index === arr.length) {
                        var obj = iterator.next();
                        if (obj.done) {
                            this.next = Iterator.Done;
                            return this.next();
                        }
                        else {
                            arr.push(obj);
                            index++;
                            return obj
                        }
                    }
                    else {
                        var obj = arr[index];
                        index++;
                        return obj;
                    }
                };
                return this.next();
            };
            var iter = new Iterator(next);
            var reset = function () {
                var iter = new Iterator(next);
                iter.reset = reset;
                return iter;
            };
            iter.reset = reset;
            return iter;
        };
        Iterator.groupJoin = function (outer, inner, comparer) {
            inner = Iterator.reuse(inner);
            return function () {
                var obj = outer.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    var outerItem = obj.value;
                    var iterator = new Iterator(Iterator.filter(inner.reset(), function (v) {
                        return comparer(outerItem, v);
                    }));
                    return Iterator.Next([outerItem, iterator]);
                }
            };
        };
        Iterator.join = function (outer, inner, comparer) {
            var iterator = new Iterator(Iterator.groupJoin(outer, inner, comparer)),
                innerIter = new Iterator(),
                outerItem,
                list;
            return function () {
                var obj = innerIter.next();
                if (obj.done) {
                    var list = iterator.next();
                    if (list.done) {
                        this.next = Iterator.Done;
                        return this.next();
                    }
                    else {
                        outerItem = list.value[0];
                        innerIter = list.value[1];
                        return this.next();
                    }
                }
                else {
                    return Iterator.Next([outerItem, obj.value]);
                }
            };
        };
        Iterator.group = function (iterator, comparer) {
            var obj;
            var iters;
            var getIter = function () {
                obj = iterator.next();
                if (!obj.done) {
                    iters = Iterator.shunt(iterator, function (v) {
                        return comparer(obj.value, v);
                    });
                }
                getIter = function () { return !obj.done; };
                return getIter();
            };
            return function () {
                if (getIter()) {
                    var iter = iters[0];
                    Iterator.unshift(iter, obj.value);
                    this.next = Iterator.group(iters[1], comparer);
                    return Iterator.Next([obj.value, iter]);
                }
                else {
                    this.next = Iterator.Done;
                    return this.next();
                }
            };
        };
        Iterator.distinct = function (iterator, comparer) {
            return function () {
                var obj = iterator.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    var iter = new Iterator(Iterator.filter(iterator, function (v) {
                        return !comparer(obj.value, v);
                    }));
                    this.next = Iterator.distinct(iter, comparer);
                    return obj;
                }
            };
        };
        Iterator.union = function (first, second, comparer) {
            return Iterator.distinct(new Iterator(Iterator.concat(first, second)), comparer)
        };
        Iterator.intersect = function (first, second, comparer) {
            first = new Iterator(Iterator.distinct(first, comparer));
            second = new Iterator(Iterator.distinct(second, comparer));
            return function () {
                var obj = first.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    var iters = Iterator.shunt(second, function (v) {
                        return comparer(obj.value, v);
                    });
                    second = iters[1];
                    if (iters[0].next().done) {
                        return this.next();
                    }
                    else {
                        return obj;
                    }
                }
            };
        };
        Iterator.except = function (first, second, comparer) {
            first = new Iterator(Iterator.distinct(first, comparer));
            second = new Iterator(Iterator.distinct(second, comparer));
            return function () {
                var obj = first.next();
                if (obj.done) {
                    this.next = Iterator.getNext(second);
                    return this.next();
                }
                else {
                    var iters = Iterator.shunt(second, function (v) {
                        return comparer(obj.value, v);
                    });
                    second = iters[1];
                    if (iters[0].next().done) {
                        return obj;
                    }
                    else {
                        return this.next();
                    }
                }
            };
        };
        Iterator.defaultIfEmpty = function (iterator, defaultValue) {
            return function () {
                var obj = iterator.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return Iterator.Next(defaultValue);
                }
                else {
                    this.next = Iterator.getNext(iterator);
                    return obj;
                }
            };
        };
        Iterator.skip = function (iterator, predicate) {
            var index = 0;

            return function () {
                var obj = iterator.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    if (predicate(obj.value, index)) {
                        index++;
                        return this.next();
                    }
                    else {
                        this.next = Iterator.getNext(iterator);
                        return obj;
                    }
                }
            };
        };
        Iterator.take = function (iterator, predicate) {
            var index = 0;

            return function () {
                var obj = iterator.next();
                if (obj.done) {
                    this.next = Iterator.Done;
                    return this.next();
                }
                else {
                    if (predicate(obj.value, index)) {
                        index++;
                        return obj;
                    }
                    else {
                        this.next = Iterator.Done;
                        return this.next();
                    }
                }
            };
        };

        return Iterator;
    })();

    var Iterable = (function () {
        var Iterable = function (src) {
            if (this instanceof Iterable) {
                if (src === undefined) {
                    return this;
                }
                else if (Array.isArray(src) || typeof src === Type.string || typeof src[Symbol.iterator] === Type.function) {
                    this[Symbol.iterator] = function () { return Iterator.FromIndexr(src); };
                } else if (typeof src === Type.function) {
                    this[Symbol.iterator] = src;
                }
                else {
                    this[Symbol.iterator] = function () { return Iterator.FromObject(src) };
                }
            }
            else {
                return new Iterable(src);
            }
        };

        Iterable.prototype[Symbol.iterator] = function () { return new Iterator(); };
        Iterable.prototype.GetIterator = function () { return this[Symbol.iterator](); };

        Iterable.Empty = function () {
            return new Iterable();
        };
        Iterable.Range = function (start, count) {
            return new Iterable(function () {
                return Iterator.Range(start, count);
            });
        };
        Iterable.Repeat = function (element, count) {
            return new Iterable(function () {
                return Iterator.Repeat(element, count);
            });
        };

        Iterable.prototype.Select = function (selector) {
            var self = this;
            var generator = function () {
                var iterator = self.GetIterator(),
                    index = 0;
                return new Iterator(Iterator.map(function (v) {
                    var res = selector(v, index);
                    index++;
                    return res;
                }, iterator));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.SelectMany = function (collectionSelector, resultSelector) {
            if (typeof resultSelector !== Type.function) {
                resultSelector = function (item, value) {
                    return value;
                };
            }

            var self = this;
            var generator = function () {
                var iterator = self.GetIterator(),
                    index = 0,
                    srcItem,
                    collection = new Iterator(Iterator.map(function (v) {
                        srcItem = v;
                        var res = collectionSelector(v, index);
                        index++;
                        return res;
                    }, iterator)),
                    iter = new Iterator(),
                    list;
                var next = function () {
                    var obj = iter.next();
                    if (obj.done) {
                        list = collection.next();
                        if (list.done) {
                            this.next = Iterator.Done;
                            return this.next();
                        }
                        else {
                            iter = Iterable(list.value).GetIterator();
                            return this.next();
                        }
                    }
                    else {
                        return Iterator.Next(resultSelector(srcItem, obj.value));
                    }
                };

                return new Iterator(next);
            };
            return new Iterable(generator);
        };

        Iterable.prototype.Where = function (predicate) {
            var self = this;
            var generator = function () {
                var iterator = self.GetIterator();
                return new Iterator(Iterator.filter(iterator, predicate));
            };
            return new Iterable(generator);
        };

        Iterable.prototype.OrderBy = function (keySelector, comparer) {
            return new OrderedIterable(this, keySelector, comparer, false);
        };
        Iterable.prototype.OrderByDescending = function (keySelector, comparer) {
            return new OrderedIterable(this, keySelector, comparer, true);
        };
        Iterable.prototype.Reverse = function () {
            var self = this;
            var generator = function () {
                var iterator = self.GetIterator();
                return new Iterator(Iterator.reverse(iterator));
            };
            return new Iterable(generator);
        };

        Iterable.prototype.Join = function (inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            var outer = this;
            var generator = function () {
                var iterator = new Iterator(Iterator.join(outer.GetIterator(), inner.GetIterator(), function (x, y) {
                    return comparer(outerKeySelector(x), innerKeySelector(y));
                }));
                return new Iterator(Iterator.map(function (v) {
                    return resultSelector(v[0], v[1]);
                }, iterator));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.GroupJoin = function (inner, outerKeySelector, innerKeySelector, resultSelector, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            var outer = this;
            var generator = function () {
                var iterator = new Iterator(Iterator.groupJoin(outer.GetIterator(), inner.GetIterator(), function (x, y) {
                    return comparer(outerKeySelector(x), innerKeySelector(y));
                }));
                return new Iterator(Iterator.map(function (v) {
                    return resultSelector(v[0], new Iterable(function () {
                        return v[1];
                    }));
                }, iterator));
            };
            return new Iterable(generator);
        };

        Iterable.prototype.GroupBy = function (keySelector, elementSelector, resultSelector, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            if (typeof elementSelector !== Type.function) {
                elementSelector = function (v) { return v; };
            }

            var self = this;
            var generator;
            if (typeof resultSelector === Type.function) {
                generator = function () {
                    var iterator = new Iterator(Iterator.group(self.GetIterator(), function (x, y) {
                        return comparer(keySelector(x), keySelector(y));
                    }));
                    return new Iterator(Iterator.map(function (v) {
                        return resultSelector(v[0], new Iterable(function () {
                            return new Iterator(Iterator.map(elementSelector, v[1]));
                        }));
                    }, iterator));
                };
            }
            else {
                generator = function () {
                    var iterator = new Iterator(Iterator.group(self.GetIterator(), function (x, y) {
                        return comparer(keySelector(x), keySelector(y));
                    }));
                    return new Iterator(Iterator.map(function (v) {
                        return new Grouping(function () {
                            return new Iterator(Iterator.map(elementSelector, v[1]));
                        }, keySelector(v[0]));
                    }, iterator));
                };
            }
            return new Iterable(generator);
        };

        Iterable.prototype.Concat = function (second) {
            var first = this;
            var generator = function () {
                return new Iterator(Iterator.concat(first.GetIterator(), second.GetIterator()));
            };
            return new Iterable(generator);
        };

        Iterable.prototype.Aggregate = function (seed, func, resultSelector) {
            if (typeof resultSelector !== Type.function) {
                resultSelector = function (v) { return v; };
            }
            return resultSelector(Iterator.reduce(this.GetIterator(), func, seed));
        };
        Iterable.prototype.Average = function (selector) {
            if (typeof selector !== Type.function) {
                selector = function (v) { return v; };
            }
            return Iterator.reduce(this.GetIterator(), function (avg, x, index) {
                return avg + (selector(x) - avg) / (index + 1);
            }, 0);
        };
        Iterable.prototype.Count = function (predicate) {
            if (typeof predicate !== Type.function) {
                predicate = Predicate;
            }
            return Iterator.reduce(this.GetIterator(), function (count, current) {
                if (predicate(current)) {
                    count++;
                }
                return count;
            }, 0);
        };
        Iterable.prototype.Max = function (selector, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Comparer;
            }
            if (typeof selector !== Type.function) {
                selector = function (v) { return v; };
            }

            return Iterator.reduce(this.GetIterator(), function (max, current) {
                var x = selector(current);
                return comparer(max, x) > 0 ? max : x;
            }, Number.MIN_VALUE);
        };
        Iterable.prototype.Min = function (selector) {
            if (typeof comparer !== Type.function) {
                comparer = Comparer;
            }
            if (typeof selector !== Type.function) {
                selector = function (v) { return v; };
            }

            return Iterator.reduce(this.GetIterator(), function (min, current) {
                var x = selector(current);
                return comparer(min, x) < 0 ? min : x;
            }, Number.MAX_VALUE);
        };
        Iterable.prototype.Sum = function (selector) {
            if (typeof selector !== Type.function) {
                selector = function (v) { return v; };
            }
            return Iterator.reduce(this.GetIterator(), function (sum, current) {
                return sum + selector(current);
            }, 0);
        };

        Iterable.prototype.Distinct = function (comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            var self = this;
            var generator = function () {
                var iterator = self.GetIterator();
                return new Iterator(Iterator.distinct(iterator, comparer));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.Union = function (second, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            var first = this;
            var generator = function () {
                return new Iterator(Iterator.union(first.GetIterator(), second.GetIterator(), comparer));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.Intersect = function (second, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            var first = this;
            var generator = function () {
                return new Iterator(Iterator.intersect(first.GetIterator(), second.GetIterator(), comparer));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.Except = function (second, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            var first = this;
            var generator = function () {
                return new Iterator(Iterator.except(first.GetIterator(), second.GetIterator(), comparer));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.Zip = function (second, resultSelector) {
            var first = this;
            var generator = function () {
                return new Iterator(Iterator.map(resultSelector, first.GetIterator(), second.GetIterator()));
            };
            return new Iterable(generator);
        };

        Iterable.prototype.OfType = function (type) {
            var predicate;
            if (typeof type === Type.Type) {
                predicate = function (v) {
                    return typeof v === type;
                };
            }
            else {
                predicate = function (v) {
                    return v instanceof type;
                };
            }

            return this.Where(predicate);
        };
        Iterable.prototype.ToArray = function () {
            return Iterator.toArray(this.GetIterator());
        };
        Iterable.prototype.ToLookup = function (keySelector, elementSelector, comparer) {
            return new Lookup(this.GroupBy(keySelector, elementSelector, null, comparer));
        };
        Iterable.prototype.ToMap = function (keySelector, elementSelector) {
            if (typeof elementSelector !== Type.function) {
                elementSelector = function (v) { return v; };
            }

            return new Map(this.Select(function (v) {
                return [keySelector(v), elementSelector(v)];
            }).ToArray());
        };

        Iterable.prototype.DefaultIfEmpty = function (defaultValue) {
            var self = this;
            var generator = function () {
                var iterator = self.GetIterator();
                return new Iterator(Iterator.defaultIfEmpty(iterator, defaultValue));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.ElementAt = function (index) {
            return Iterator.ref(this.GetIterator(), index);
        };
        Iterable.prototype.First = function (predicate) {
            if (typeof predicate !== Type.function) {
                predicate = Predicate;
            }

            var res;
            Iterator.forEach(this.GetIterator(), function (v) {
                if (predicate(v)) {
                    res = v;
                    return false;
                }
            });
            return res;
        };
        Iterable.prototype.Last = function (predicate) {
            return this.Reverse().First(predicate);
        };

        Iterable.prototype.SequenceEqual = function (second, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            var first = this;
            return Iterator.sequenceEqual(first.GetIterator(), second.GetIterator(), comparer);

        };

        Iterable.prototype.All = function (predicate) {
            var access = false;
            var tmp = predicate;
            predicate = function (v) {
                access = true;
                predicate = tmp;
                return predicate(v);
            };

            Iterator.forEach(this.GetIterator(), function (v) {
                if (!predicate(v)) {
                    access = false;
                    return false;
                }
            });
            return access;
        };
        Iterable.prototype.Any = function (predicate) {
            if (typeof predicate !== Type.function) {
                predicate = Predicate;
            }

            var access = false;
            Iterator.forEach(this.GetIterator(), function (v) {
                if (predicate(v)) {
                    access = true;
                    return false;
                }
            });
            return access;
        };
        Iterable.prototype.Contains = function (value, comparer) {
            if (typeof comparer !== Type.function) {
                comparer = Equal;
            }

            return Iterator.indexOf(this.GetIterator(), value, comparer) !== -1;
        };

        Iterable.prototype.Skip = function (count) {
            return this.SkipWhile(function (v, i) { return i < count; });
        };
        Iterable.prototype.SkipWhile = function (predicate) {
            var self = this;
            var generator = function () {
                var iterator = self.GetIterator();
                return new Iterator(Iterator.skip(iterator, predicate));
            };
            return new Iterable(generator);
        };
        Iterable.prototype.Take = function (count) {
            return this.TakeWhile(function (v, i) { return i < count; });
        };
        Iterable.prototype.TakeWhile = function (predicate) {
            var self = this;
            var generator = function () {
                var iterator = self.GetIterator();
                return new Iterator(Iterator.take(iterator, predicate));
            };
            return new Iterable(generator);
        };

        Iterable.prototype.ForEach = function (action) {
            Iterator.forEach(this.GetIterator(), action);
        };

        return Iterable;
    })();

    var OrderedIterable = (function () {
        var OrderedIterable = function (src, myKeySelector, myComparer, myDescending) {
            Iterable.call(this, src);

            if (typeof myComparer !== Type.function) {
                myComparer = Comparer;
            }
            this.CreateOrderedEnumerable = function (keySelector, comparer, descending) {
                if (typeof comparer !== Type.function) {
                    comparer = Comparer;
                }

                return new OrderedIterable(raw, function (v) { return v; }, function (x, y) {
                    var res = myComparer(myKeySelector(x), myKeySelector(y));
                    if (res === 0) {
                        res = comparer(keySelector(x), keySelector(y));
                        if (descending) {
                            res = -res;
                        }
                        if (myDescending) {
                            res = -res;
                        }
                    }
                    return res;
                }, myDescending);
            };

            var raw = this[Symbol.iterator];
            this[Symbol.iterator] = function () {
                var iterator = raw.call(this);
                return new Iterator(Iterator.sort(iterator, function (x, y) {
                    var res = myComparer(myKeySelector(x), myKeySelector(y));
                    if (myDescending) {
                        res = -res;
                    }
                    return res;
                }));
            };
        };
        var tmp = Function();
        tmp.prototype = Iterable.prototype;
        OrderedIterable.prototype = new tmp();

        OrderedIterable.prototype.CreateOrderedEnumerable = Function();
        OrderedIterable.prototype.ThenBy = function (keySelector, comparer) {
            return this.CreateOrderedEnumerable(keySelector, comparer, false);
        };
        OrderedIterable.prototype.ThenByDescending = function (keySelector, comparer) {
            return this.CreateOrderedEnumerable(keySelector, comparer, true);
        };

        return OrderedIterable;
    })();

    var Grouping = (function () {
        var Grouping = function (src, key) {
            Iterable.call(this, src);

            this.Key = key;
        };
        var tmp = Function();
        tmp.prototype = Iterable.prototype;
        Grouping.prototype = new tmp();

        Grouping.prototype.Key = null;

        return Grouping;
    })();

    var Lookup = (function () {
        var Lookup = function (src) {
            Iterable.call(this, src);

            var count = null;
            Object.defineProperty(this, 'Length', {
                get: function () {
                    if (count === null) {
                        count = this.Count();
                    }
                    return count;
                }
            });
        };
        var tmp = Function();
        tmp.prototype = Iterable.prototype;
        Lookup.prototype = new tmp();

        Lookup.prototype.Length = Number();
        Lookup.prototype.ContainsKey = function (key) {
            return this.Contains(key, function (key, x) {
                return key === x.Key;
            });
        };
        Lookup.prototype.Get = function (key) {
            var iterator = this.GetIterator();
            var res;
            Iterator.forEach(iterator, function (v) {
                if (key === v.Key) {
                    res = new Iterable(v);
                    return false;
                }
            });
            return res;
        };

        return Lookup;
    })();
    //Dictionary
    if (window.Map === undefined) {
        Map = (function () {
            var Map = function (pairs) {
                var map = this,
                    table = [],
                    K = 0,
                    V = 1;
                this.size = 0;

                var deal = function (key, hit, miss) {
                    var list = table[key];
                    if (!Array.isArray(list)) {
                        list = [];
                        table[key] = list;
                    }
                    for (var i = 0; i !== list.length; i++) {
                        if (key === list[i][K]) {
                            return hit(list, i);
                        }
                    }
                    return miss(list);
                };
                this.set = function (key, value) {
                    return deal(key, function (list, i) {
                        list[i][V] = value;
                        return map;
                    }, function (list) {
                        list.push([key, value]);
                        map.size++;
                        return map;
                    });
                };
                this.get = function (key) {
                    return deal(key, function (list, i) {
                        return list[i][V];
                    }, function () {
                        return undefined;
                    });
                };
                this.has = function (key) {
                    return deal(key, function () {
                        return true;
                    }, function () {
                        return false;
                    });
                };
                this.delete = function (key) {
                    return deal(key, function (list, i) {
                        list.splice(i, 1);
                        return true;
                    }, function () {
                        return false;
                    });
                };
                this.clear = function () {
                    table = [];
                    this.size = 0;
                };

                var createIterator = function (keySelector) {
                    var lists = Iterator.FromObject(table),
                        list = [],
                        index = 0;
                    var next = function () {
                        if (index === list.length) {
                            index = 0;
                            var obj = lists.next();
                            if (obj.done) {
                                this.next = Iterator.Done;
                                return this.next();
                            }
                            else {
                                list = obj.value.value;
                            }
                            return this.next();
                        }
                        else {
                            var res = Iterator.Next(keySelector(list[index]));
                            index++;
                            return res;
                        }
                    };
                    return new Iterator(next);
                }
                this.keys = function () {
                    return createIterator(function (pair) {
                        return pair[K];
                    });
                };
                this.values = function () {
                    return createIterator(function (pair) {
                        return pair[V];
                    });
                };
                this.entries = function () {
                    return createIterator(function (pair) {
                        return pair;
                    });
                };
                this.forEach = function (action) {
                    Iterator.forEach(this.entries(), function (pair) {
                        return action(pair[K], pair[V]);
                    });
                };

                if (pairs === undefined) {
                    pairs = [];
                }
                pairs.forEach(function (item) {
                    var key = item[K];
                    var value = item[V];
                    map.set(key, value);
                });
                pairs = null;
            };
            Map.prototype = {
                size: Number(),
                set: Function(),
                get: Function(),
                has: Function(),
                delete: Function(),
                clear: Function(),
                keys: Function(),
                values: Function(),
                entries: Function(),
                forEach: Function()
            };

            return Map;
        })();
    }

    _export.Iterator = Iterator;
    _export.Iterable = Iterable;
})(window);