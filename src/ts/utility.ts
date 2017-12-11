export type IEqual<T> = (x: T, y: T) => boolean;
export type IPredicate<T> = (v: T) => boolean;
export type ISelector<TSource, TResult> = (v: TSource) => TResult;
export type IComparer<T> = (x: T, y: T) => Comparers;
export enum TheError {
    NotFound = 'NotFound', ArgumentError = 'ArgumentError', NotSingle = 'NotSingle', KeyRepeat = 'KeyRepeat', Never = 'Never'
}
export enum Comparers {
    ['<'] = -1, ['='] = 0, ['>'] = 1
}
export const Equal: IEqual<any> = (x, y) => x === y;
export const Predicate: IPredicate<any> = v => true;
export const Selector: ISelector<any, any> = v => v;
export const Comparer: IComparer<any> = (x, y) => x < y ? Comparers['<'] : x === y ? Comparers['='] : Comparers['>'];
export const ResultSelector = (source: any, element: any) => element;
export const ESType = {
    string: (o: any) => typeof (o) === 'string',
    number: (o: any) => typeof (o) === 'number',
    boolean: (o: any) => typeof (o) === 'boolean',
    symbol: (o: any) => typeof (o) === 'symbol',
    undefined: (o: any) => typeof (o) === 'undefined',
    object: (o: any) => typeof (o) === 'object',
    function: (o: any) => typeof (o) === 'function',
    any: (o: any) => true
}