export type SupportedTypes = Array<string | { [index: string]: any } | number | null>;

export type Query<T> = {
    $eq?: T;
    $ne?: T;
    $or?: Array<Partial<T>>;
    $gt?: T;
    $gte?: T;
    $lt?: T;
    $lte?: T;
    $mod?: number[];
    $in?: Array<Partial<T>>;
    $nin?: Array<T>;
    $not?: Query<T>;
    $type?: any;
    $all?: Array<T>;
    $size?: number;
    $nor?: Array<Partial<T>>;
    $and?: Array<Partial<T>>;
    $regex?: RegExp | string;
    $elemMatch?: { [index: string]: Query<T> };
    $exists?: boolean;
    $options?: "i" | "g" | "m" | "u";
}

export interface InternalQuery<T extends SupportedTypes> extends Query<T[0]> {
    $where?: string | WhereFn<T>;
}

export type ExternalQuery<T extends SupportedTypes> = {
    [P in keyof T[0]]?: InternalQuery<T>;
}

export type WhereFn<T extends SupportedTypes> = (this: T[0], value: T[0], index: number, array: T) => boolean;

export type FilterFn = <T>(value: T, index?: number, array?: T[]) => boolean;

export type SiftQuery<T extends SupportedTypes> = ExternalQuery<T> & InternalQuery<T>;
export type SiftQueryNumber = Query<number>;
export type SiftQueryString = Query<string>;

export type PluginDefinition<T = any> = {
    [index: string]: (a: T, b: T) => boolean | number;
}

export type PluginFunction<T> = (sift: Sift) => PluginDefinition<T>;

export type Exec = <T extends SupportedTypes>(array: T) => T;

export interface Sift {
    <T extends SupportedTypes>(query: RegExp, target: T, rawSelector?: any): T;
    <T = any>(query: SiftQuery<any>, rawSelector: (item: T) => boolean): Exec;
    <T extends SupportedTypes = any[]>(query: SiftQuery<T>): FilterFn;
    (query: SiftQueryString, target: string[], rawSelector?: any): string[];
    (query: SiftQueryNumber, target: number[], rawSelector?: any): number[];
    <T extends SupportedTypes>(query: SiftQuery<T>, target: T, rawSelector?: any): T;
    indexOf<T extends SupportedTypes>(query: SiftQuery<T>, target: T, rawSelector?: any): number;
    use<K = any>(plugin: PluginFunction<K> | PluginDefinition<K>): void;
    compare<T, K>(a: T, b: K): 0 | -1 | 1;
}

declare global {
    const sift: Sift
}

declare const Sift: Sift
export default Sift
