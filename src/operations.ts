import {
  BaseOperation,
  EqualsOperation,
  Options,
  createTester,
  Tester,
  createQueryOperation,
  QueryOperation,
  numericalOperationCreator,
  Operation,
  GroupOperation
} from "./core";
import { Key, comparable, isFunction } from "./utils";

class $Ne extends BaseOperation<any> {
  private _test: Tester;
  init() {
    this._test = createTester(this.params, this.options.compare);
  }
  reset() {
    super.reset();
    this.success = true;
  }
  next(item: any) {
    if (this._test(item)) {
      this.done = true;
      this.success = false;
    }
  }
}

class $ElemMatch extends BaseOperation<Query> {
  private _queryOperation: QueryOperation;
  init() {
    this._queryOperation = createQueryOperation(
      this.params,
      this.owneryQuery,
      this.options
    );
  }
  reset() {
    this._queryOperation.reset();
  }
  next(item: any, key: Key, owner: any) {
    this._queryOperation.next(item, key, owner);
    this.done = this._queryOperation.done;
    this.success = this._queryOperation.success;
  }
}

class $Not extends $ElemMatch {
  next(item: any, key: Key, owner: any) {
    super.next(item, key, owner);
    this.success = !this.success;
  }
}

class $Or extends BaseOperation<any> {
  private _ops: Operation[];
  init() {
    this._ops = this.params.map(op =>
      createQueryOperation(op, null, this.options)
    );
  }
  reset() {
    this.done = false;
    this.success = false;
    for (let i = 0, { length } = this._ops; i < length; i++) {
      this._ops[i].reset();
    }
  }
  next(item: any, key: Key, owner: any) {
    let done = false;
    let success = false;
    for (let i = 0, { length } = this._ops; i < length; i++) {
      const op = this._ops[i];
      op.next(item, key, owner);
      if (op.success) {
        done = true;
        success = op.success;
        break;
      }
    }

    this.success = success;
    this.done = done;
  }
}

class $Nor extends $Or {
  next(item: any, key: Key, owner: any) {
    super.next(item, key, owner);
    this.success = !this.success;
  }
}

class $Exists extends BaseOperation<boolean> {
  next(item: any, key: Key, owner: any) {
    if (owner.hasOwnProperty(key) === this.params) {
      this.done = true;
      this.success = true;
    }
  }
}

class $And extends GroupOperation {
  constructor(params: Query[], owneryQuery: Query, options: Options) {
    super(
      params,
      owneryQuery,
      options,
      params.map(query => createQueryOperation(query, owneryQuery, options))
    );
  }
  next(item: any, key: Key, owner: any) {
    this.childrenNext(item, key, owner);
  }
}

export type Query = {
  [identifier: string]: Query | Object;
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

const $eq = (params: any, owneryQuery: Query, options: Options) =>
  new EqualsOperation(params, owneryQuery, options);
const $ne = (params: any, owneryQuery: Query, options: Options) =>
  new $Ne(params, owneryQuery, options);
const $or = (params: Query[], owneryQuery: Query, options: Options) =>
  new $Or(params, owneryQuery, options);
const $nor = (params: Query[], owneryQuery: Query, options: Options) =>
  new $Nor(params, owneryQuery, options);
const $elemMatch = (params: any, owneryQuery: Query, options: Options) =>
  new $ElemMatch(params, owneryQuery, options);
const $nin = (params: any, owneryQuery: Query, options: Options) =>
  new $Nor(params, owneryQuery, options);
const $in = (params: any, owneryQuery: Query, options: Options) =>
  new $Or(params, owneryQuery, options);
const $lt = numericalOperationCreator(
  (params: any, owneryQuery: Query, options: Options) =>
    new EqualsOperation(b => b < params, owneryQuery, options)
);
const $lte = numericalOperationCreator(
  (params: any, owneryQuery: Query, options: Options) =>
    new EqualsOperation(b => b <= params, owneryQuery, options)
);
const $gt = numericalOperationCreator(
  (params: any, owneryQuery: Query, options: Options) =>
    new EqualsOperation(b => b > params, owneryQuery, options)
);
const $gte = numericalOperationCreator(
  (params: any, owneryQuery: Query, options: Options) =>
    new EqualsOperation(b => b >= params, owneryQuery, options)
);
const $mod = (
  [mod, equalsValue]: number[],
  owneryQuery: Query,
  options: Options
) =>
  new EqualsOperation(
    b => comparable(b) % mod === equalsValue,
    owneryQuery,
    options
  );
const $exists = (params: boolean, owneryQuery: Query, options: Options) =>
  new $Exists(params, owneryQuery, options);
const $regex = (pattern: string, owneryQuery: Query, options: Options) =>
  new EqualsOperation(
    new RegExp(pattern, owneryQuery.$options),
    owneryQuery,
    options
  );
const $not = (params: any, owneryQuery: Query, options: Options) =>
  new $Not(params, owneryQuery, options);
const $type = (clazz: Function, owneryQuery: Query, options: Options) =>
  new EqualsOperation(
    b => (b != null ? b instanceof clazz || b.constructor === clazz : false),
    owneryQuery,
    options
  );
const $and = (params: Query[], ownerQuery: Query, options: Options) =>
  new $And(params, ownerQuery, options);
const $all = $and;
const $size = (params: number, ownerQuery: Query, options: Options) =>
  new EqualsOperation(b => b && b.length === params, ownerQuery, options);
const $options = () => null;
const $where = (
  params: string | Function,
  ownerQuery: Query,
  options: Options
) => {
  let test;

  if (isFunction(params)) {
    test = params;
  } else if (!process.env.CSP_ENABLED) {
    test = new Function("obj", "return " + params);
  } else {
    throw new Error(
      `In CSP mode, sift does not support strings in "$where" condition`
    );
  }

  return new EqualsOperation(b => test.bind(b)(b), ownerQuery, options);
};

export const creators = {
  $lt,
  $lte,
  $mod,
  $gt,
  $gte,
  $eq,
  $or,
  $nor,
  $and,
  $options,
  $regex,
  $ne,
  $nin,
  $all,
  $size,
  $in,
  $type,
  $elemMatch,
  $exists,
  $not,
  $where
};
