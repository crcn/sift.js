import {
  NamedBaseOperation,
  EqualsOperation,
  Options,
  createTester,
  Tester,
  createQueryOperation,
  QueryOperation,
  Operation,
  Query,
  NamedGroupOperation,
  numericalOperation,
  containsOperation,
  NamedOperation
} from "./core";
import { Key, comparable, isFunction, isArray } from "./utils";

class $Ne extends NamedBaseOperation<any> {
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
// https://docs.mongodb.com/manual/reference/operator/query/elemMatch/
class $ElemMatch extends NamedBaseOperation<Query<any>> {
  private _queryOperation: QueryOperation<any>;
  init() {
    this._queryOperation = createQueryOperation(
      this.params,
      this.owneryQuery,
      this.options
    );
  }
  reset() {
    super.reset();
    this._queryOperation.reset();
  }
  next(item: any, key: Key, owner: any[]) {
    this._queryOperation.reset();

    if (isArray(owner)) {
      this._queryOperation.next(item, key, owner);
      this.done =
        this.done || this._queryOperation.done || key === owner.length - 1;
      this.success = this.success || this._queryOperation.success;
    } else {
      this.done = true;
      this.success = false;
    }
  }
}

class $Not extends NamedBaseOperation<Query<any>> {
  private _queryOperation: QueryOperation<any>;
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
    this.success = !this._queryOperation.success;
  }
}

class $Or extends NamedBaseOperation<any> {
  private _ops: Operation<any>[];
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

class $In extends NamedBaseOperation<any> {
  private _testers: Tester[];
  init() {
    this._testers = this.params.map(value => {
      if (containsOperation(value)) {
        throw new Error(
          `cannot nest $ under ${this.constructor.name.toLowerCase()}`
        );
      }
      return createTester(value, this.options.compare);
    });
  }
  next(item: any, key: Key, owner: any) {
    let done = false;
    let success = false;
    for (let i = 0, { length } = this._testers; i < length; i++) {
      const test = this._testers[i];
      if (test(item)) {
        done = true;
        success = true;
        break;
      }
    }

    this.success = success;
    this.done = done;
  }
}

class $Nin extends $In {
  next(item: any, key: Key, owner: any) {
    super.next(item, key, owner);
    this.success = !this.success;
  }
}

class $Exists extends NamedBaseOperation<boolean> {
  next(item: any, key: Key, owner: any) {
    if (owner.hasOwnProperty(key) === this.params) {
      this.done = true;
      this.success = true;
    }
  }
}

class $And extends NamedGroupOperation {
  constructor(
    params: Query<any>[],
    owneryQuery: Query<any>,
    options: Options,
    name: string
  ) {
    super(
      params,
      owneryQuery,
      options,
      params.map(query => createQueryOperation(query, owneryQuery, options)),
      name
    );
  }
  next(item: any, key: Key, owner: any) {
    this.childrenNext(item, key, owner);
  }
}

export const $eq = (params: any, owneryQuery: Query<any>, options: Options) =>
  new EqualsOperation(params, owneryQuery, options);
export const $ne = (
  params: any,
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $Ne(params, owneryQuery, options, name);
export const $or = (
  params: Query<any>[],
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $Or(params, owneryQuery, options, name);
export const $nor = (
  params: Query<any>[],
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $Nor(params, owneryQuery, options, name);
export const $elemMatch = (
  params: any,
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $ElemMatch(params, owneryQuery, options, name);
export const $nin = (
  params: any,
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $Nin(params, owneryQuery, options, name);
export const $in = (
  params: any,
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $In(params, owneryQuery, options, name);

export const $lt = numericalOperation(params => b => b < params);
export const $lte = numericalOperation(params => b => b <= params);
export const $gt = numericalOperation(params => b => b > params);
export const $gte = numericalOperation(params => b => b >= params);
export const $mod = (
  [mod, equalsValue]: number[],
  owneryQuery: Query<any>,
  options: Options
) =>
  new EqualsOperation(
    b => comparable(b) % mod === equalsValue,
    owneryQuery,
    options
  );
export const $exists = (
  params: boolean,
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $Exists(params, owneryQuery, options, name);
export const $regex = (
  pattern: string,
  owneryQuery: Query<any>,
  options: Options
) =>
  new EqualsOperation(
    new RegExp(pattern, owneryQuery.$options),
    owneryQuery,
    options
  );
export const $not = (
  params: any,
  owneryQuery: Query<any>,
  options: Options,
  name: string
) => new $Not(params, owneryQuery, options, name);
export const $type = (
  clazz: Function,
  owneryQuery: Query<any>,
  options: Options
) =>
  new EqualsOperation(
    b => (b != null ? b instanceof clazz || b.constructor === clazz : false),
    owneryQuery,
    options
  );
export const $and = (
  params: Query<any>[],
  ownerQuery: Query<any>,
  options: Options,
  name: string
) => new $And(params, ownerQuery, options, name);
export const $all = $and;
export const $size = (
  params: number,
  ownerQuery: Query<any>,
  options: Options
) => new EqualsOperation(b => b && b.length === params, ownerQuery, options);
export const $options = () => null;
export const $where = (
  params: string | Function,
  ownerQuery: Query<any>,
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
