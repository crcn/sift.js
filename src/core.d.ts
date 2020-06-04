import { Key, Comparator } from "./utils";
export interface Operation {
  readonly success: boolean;
  readonly done: boolean;
  reset(): any;
  next(item: any, key: Key, owner: any): any;
}
export declare type Tester = (item: any, key?: Key, owner?: any) => boolean;
export declare type OperationCreator = (
  params: any,
  parentQuery: any,
  options: Options
) => Operation;
export declare type Query = {
  [identifier: string]: Query | Object | undefined;
  $eq?: any;
  $ne?: any;
  $elemMatch?: Query;
  $lt?: number;
  $gt?: number;
  $lte?: number;
  $gte?: number;
  $mod?: [number, number];
  $exists?: boolean;
  $regex?: string;
  $options?: "i" | "g" | "m" | "u";
  $type: Function;
  $or?: Query[];
  $nor?: Query[];
};
export abstract class BaseOperation<TParams> implements Operation {
  readonly params: TParams;
  readonly owneryQuery: any;
  readonly options: Options;
  success: boolean;
  done: boolean;
  constructor(params: TParams, owneryQuery: any, options: Options);
  protected init(): void;
  reset(): void;
  abstract next(item: any, key: Key, parent: any): any;
}
export abstract class GroupOperation extends BaseOperation<any> {
  protected readonly _children: Operation[];
  success: boolean;
  done: boolean;
  constructor(
    params: any,
    owneryQuery: any,
    options: Options,
    _children: Operation[]
  );
  /**
   */
  reset(): void;
  abstract next(item: any, key: Key, owner: any): any;
  /**
   */
  protected childrenNext(item: any, key: Key, owner: any): void;
}
export declare class QueryOperation extends GroupOperation {
  /**
   */
  next(item: any, key: Key, parent: any): void;
}
export declare class NestedOperation extends GroupOperation {
  readonly keyPath: Key[];
  constructor(
    keyPath: Key[],
    params: any,
    owneryQuery: any,
    options: Options,
    children: Operation[]
  );
  /**
   */
  next(item: any, key: Key, parent: any): void;
  /**
   */
  private _nextNestedValue;
}
export declare const createTester: (a: any, compare: Comparator) => any;
export declare class EqualsOperation<TParam> extends BaseOperation<TParam> {
  private _test;
  init(): void;
  next(item: any, key: Key, parent: any): void;
}
export declare const createEqualsOperation: (
  params: any,
  owneryQuery: any,
  options: Options
) => EqualsOperation<any>;
export declare class NopeOperation<TParam> extends BaseOperation<TParam> {
  next(): void;
}
export declare const numericalOperationCreator: (
  createNumericalOperation: OperationCreator
) => (
  params: any,
  owneryQuery: any,
  options: Options
) => Operation | NopeOperation<any>;
export declare const numericalOperation: (
  createTester: (any: any) => Tester
) => (
  params: any,
  owneryQuery: any,
  options: Options
) => Operation | NopeOperation<any>;
export declare type Options = {
  operations: {
    [identifier: string]: OperationCreator;
  };
  compare: (a: any, b: any) => boolean;
};
export declare const containsOperation: (query: any) => boolean;
export declare const createQueryOperation: (
  query: any,
  owneryQuery: any,
  options: Options
) => any;
export declare const createQueryTester: <TItem>(
  query: Query,
  { compare, operations }?: Partial<Options>
) => (item: TItem, key?: string | number, owner?: any) => any;
