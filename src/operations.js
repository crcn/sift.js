"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const utils_1 = require("./utils");
class $Ne extends core_1.BaseOperation {
  init() {
    this._test = core_1.createTester(this.params, this.options.compare);
  }
  reset() {
    super.reset();
    this.success = true;
  }
  next(item) {
    if (this._test(item)) {
      this.done = true;
      this.success = false;
    }
  }
}
// https://docs.mongodb.com/manual/reference/operator/query/elemMatch/
class $ElemMatch extends core_1.BaseOperation {
  init() {
    this._queryOperation = core_1.createQueryOperation(
      this.params,
      this.owneryQuery,
      this.options
    );
  }
  reset() {
    this._queryOperation.reset();
  }
  next(item, key, owner) {
    this._queryOperation.reset();
    if (utils_1.isArray(owner)) {
      this._queryOperation.next(item, key, owner);
      this.done = this._queryOperation.done || key === owner.length - 1;
      this.success = this._queryOperation.success;
    } else {
      this.done = true;
      this.success = false;
    }
  }
}
class $Not extends core_1.BaseOperation {
  init() {
    this._queryOperation = core_1.createQueryOperation(
      this.params,
      this.owneryQuery,
      this.options
    );
  }
  reset() {
    this._queryOperation.reset();
  }
  next(item, key, owner) {
    this._queryOperation.next(item, key, owner);
    this.done = this._queryOperation.done;
    this.success = !this._queryOperation.success;
  }
}
class $Or extends core_1.BaseOperation {
  init() {
    this._ops = this.params.map(op =>
      core_1.createQueryOperation(op, null, this.options)
    );
  }
  reset() {
    this.done = false;
    this.success = false;
    for (let i = 0, { length } = this._ops; i < length; i++) {
      this._ops[i].reset();
    }
  }
  next(item, key, owner) {
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
  next(item, key, owner) {
    super.next(item, key, owner);
    this.success = !this.success;
  }
}
class $In extends core_1.BaseOperation {
  init() {
    this._testers = this.params.map(value => {
      if (core_1.containsOperation(value)) {
        throw new Error(
          `cannot nest $ under ${this.constructor.name.toLowerCase()}`
        );
      }
      return core_1.createTester(value, this.options.compare);
    });
  }
  next(item, key, owner) {
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
  next(item, key, owner) {
    super.next(item, key, owner);
    this.success = !this.success;
  }
}
class $Exists extends core_1.BaseOperation {
  next(item, key, owner) {
    if (owner.hasOwnProperty(key) === this.params) {
      this.done = true;
      this.success = true;
    }
  }
}
class $And extends core_1.GroupOperation {
  constructor(params, owneryQuery, options) {
    super(
      params,
      owneryQuery,
      options,
      params.map(query =>
        core_1.createQueryOperation(query, owneryQuery, options)
      )
    );
  }
  next(item, key, owner) {
    this.childrenNext(item, key, owner);
  }
}
exports.$eq = (params, owneryQuery, options) =>
  new core_1.EqualsOperation(params, owneryQuery, options);
exports.$ne = (params, owneryQuery, options) =>
  new $Ne(params, owneryQuery, options);
exports.$or = (params, owneryQuery, options) =>
  new $Or(params, owneryQuery, options);
exports.$nor = (params, owneryQuery, options) =>
  new $Nor(params, owneryQuery, options);
exports.$elemMatch = (params, owneryQuery, options) =>
  new $ElemMatch(params, owneryQuery, options);
exports.$nin = (params, owneryQuery, options) =>
  new $Nin(params, owneryQuery, options);
exports.$in = (params, owneryQuery, options) =>
  new $In(params, owneryQuery, options);
exports.$lt = core_1.numericalOperation(params => b => b < params);
exports.$lte = core_1.numericalOperation(params => b => b <= params);
exports.$gt = core_1.numericalOperation(params => b => b > params);
exports.$gte = core_1.numericalOperation(params => b => b >= params);
exports.$mod = ([mod, equalsValue], owneryQuery, options) =>
  new core_1.EqualsOperation(
    b => utils_1.comparable(b) % mod === equalsValue,
    owneryQuery,
    options
  );
exports.$exists = (params, owneryQuery, options) =>
  new $Exists(params, owneryQuery, options);
exports.$regex = (pattern, owneryQuery, options) =>
  new core_1.EqualsOperation(
    new RegExp(pattern, owneryQuery.$options),
    owneryQuery,
    options
  );
exports.$not = (params, owneryQuery, options) =>
  new $Not(params, owneryQuery, options);
exports.$type = (clazz, owneryQuery, options) =>
  new core_1.EqualsOperation(
    b => (b != null ? b instanceof clazz || b.constructor === clazz : false),
    owneryQuery,
    options
  );
exports.$and = (params, ownerQuery, options) =>
  new $And(params, ownerQuery, options);
exports.$all = exports.$and;
exports.$size = (params, ownerQuery, options) =>
  new core_1.EqualsOperation(
    b => b && b.length === params,
    ownerQuery,
    options
  );
exports.$options = () => null;
exports.$where = (params, ownerQuery, options) => {
  let test;
  if (utils_1.isFunction(params)) {
    test = params;
  } else if (!process.env.CSP_ENABLED) {
    test = new Function("obj", "return " + params);
  } else {
    throw new Error(
      `In CSP mode, sift does not support strings in "$where" condition`
    );
  }
  return new core_1.EqualsOperation(b => test.bind(b)(b), ownerQuery, options);
};
//# sourceMappingURL=operations.js.map
