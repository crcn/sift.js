import {
  BaseOperation,
  EqualsOperation,
  Options,
  Operation,
  Query,
  GroupOperation
} from "./core";
import { Key } from "./utils";
declare class $Ne extends BaseOperation<any> {
  private _test;
  init(): void;
  reset(): void;
  next(item: any): void;
}
declare class $ElemMatch extends BaseOperation<Query> {
  private _queryOperation;
  private _current;
  init(): void;
  reset(): void;
  next(item: any, key: Key, owner: any[]): void;
}
declare class $Not extends BaseOperation<Query> {
  private _queryOperation;
  init(): void;
  reset(): void;
  next(item: any, key: Key, owner: any): void;
}
declare class $Or extends BaseOperation<any> {
  private _ops;
  init(): void;
  reset(): void;
  next(item: any, key: Key, owner: any): void;
}
declare class $Nor extends $Or {
  next(item: any, key: Key, owner: any): void;
}
declare class $In extends BaseOperation<any> {
  private _testers;
  init(): void;
  next(item: any, key: Key, owner: any): void;
}
declare class $Nin extends $In {
  next(item: any, key: Key, owner: any): void;
}
declare class $Exists extends BaseOperation<boolean> {
  next(item: any, key: Key, owner: any): void;
}
declare class $And extends GroupOperation {
  constructor(params: Query[], owneryQuery: Query, options: Options);
  next(item: any, key: Key, owner: any): void;
}
export declare const $eq: (
  params: any,
  owneryQuery: Query,
  options: Options
) => EqualsOperation<any>;
export declare const $ne: (
  params: any,
  owneryQuery: Query,
  options: Options
) => $Ne;
export declare const $or: (
  params: Query[],
  owneryQuery: Query,
  options: Options
) => $Or;
export declare const $nor: (
  params: Query[],
  owneryQuery: Query,
  options: Options
) => $Nor;
export declare const $elemMatch: (
  params: any,
  owneryQuery: Query,
  options: Options
) => $ElemMatch;
export declare const $nin: (
  params: any,
  owneryQuery: Query,
  options: Options
) => $Nin;
export declare const $in: (
  params: any,
  owneryQuery: Query,
  options: Options
) => $In;
export declare const $lt: (
  params: any,
  owneryQuery: any,
  options: Options
) => Operation | import("./core").NopeOperation<any>;
export declare const $lte: (
  params: any,
  owneryQuery: any,
  options: Options
) => Operation | import("./core").NopeOperation<any>;
export declare const $gt: (
  params: any,
  owneryQuery: any,
  options: Options
) => Operation | import("./core").NopeOperation<any>;
export declare const $gte: (
  params: any,
  owneryQuery: any,
  options: Options
) => Operation | import("./core").NopeOperation<any>;
export declare const $mod: (
  [mod, equalsValue]: number[],
  owneryQuery: Query,
  options: Options
) => EqualsOperation<(b: any) => boolean>;
export declare const $exists: (
  params: boolean,
  owneryQuery: Query,
  options: Options
) => $Exists;
export declare const $regex: (
  pattern: string,
  owneryQuery: Query,
  options: Options
) => EqualsOperation<RegExp>;
export declare const $not: (
  params: any,
  owneryQuery: Query,
  options: Options
) => $Not;
export declare const $type: (
  clazz: Function,
  owneryQuery: Query,
  options: Options
) => EqualsOperation<(b: any) => boolean>;
export declare const $and: (
  params: Query[],
  ownerQuery: Query,
  options: Options
) => $And;
export declare const $all: (
  params: Query[],
  ownerQuery: Query,
  options: Options
) => $And;
export declare const $size: (
  params: number,
  ownerQuery: Query,
  options: Options
) => EqualsOperation<(b: any) => boolean>;
export declare const $options: () => any;
export declare const $where: (
  params: TimerHandler,
  ownerQuery: Query,
  options: Options
) => EqualsOperation<(b: any) => any>;
export {};
