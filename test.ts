import { Stream } from './Stream';
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
export class Enumerable<T>{
    public readonly GetStream: () => Stream<T>;
    private constructor(s: Stream<T>) {
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
    public Aggregate(func: (lastResult: T, currentValue: T) => T): T;
    public Aggregate<TAccumulate>(seed: TAccumulate, func: (lastResult: TAccumulate, currentValue: T) => TAccumulate): TAccumulate;
    public Aggregate<TAccumulate, TResult>(seed: TAccumulate, func: (lastResult: TAccumulate, currentValue: T) => TAccumulate, resultSelector: ISelector<TAccumulate, TResult>): TResult;
    public Aggregate(arg0: any, arg1?: any, arg2?: any): any {

    }
}
const Create = {
    Range: function create(start: number, count: number): Stream<number> {
        if (count === 0) return Stream.End;
        else return new Stream(start, () => create(start + 1, count - 1));
    },
    Repeat: function create<T>(element: T, count: number): Stream<T> {
        if (count === 0) return Stream.End;
        else return new Stream(element, () => create(element, count - 1));
    }
};