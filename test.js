"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
}
exports.Enumerable = Enumerable;
const Create = {
    Range: function create(start, count) {
        if (count === 0)
            return Stream_1.Stream.End;
        else
            return new Stream_1.Stream(start, () => create(start + 1, count - 1));
    }
};
Enumerable.Range(2, 4).GetStream().toArray();
