"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
/**
 * Walks through each value given the context - used for nested operations. E.g:
 * { "person.address": { $eq: "blarg" }}
 */
const walkKeyPathValues = (item, keyPath, next, depth, key, owner) => {
  const currentKey = keyPath[depth];
  // if array, then try matching. Might fall through for cases like:
  // { $eq: [1, 2, 3] }, [ 1, 2, 3 ].
  if (utils_1.isArray(item) && isNaN(Number(currentKey))) {
    for (let i = 0, { length } = item; i < length; i++) {
      // if FALSE is returned, then terminate walker. For operations, this simply
      // means that the search critera was met.
      if (!walkKeyPathValues(item[i], keyPath, next, depth, i, item)) {
        return false;
      }
    }
  }
  if (depth === keyPath.length || item == null) {
    return next(item, key, owner);
  }
  return walkKeyPathValues(
    item[currentKey],
    keyPath,
    next,
    depth + 1,
    currentKey,
    item
  );
};
class BaseOperation {
  constructor(params, owneryQuery, options) {
    this.params = params;
    this.owneryQuery = owneryQuery;
    this.options = options;
    this.init();
  }
  init() {}
  reset() {
    this.done = false;
    this.success = false;
  }
}
exports.BaseOperation = BaseOperation;
class GroupOperation extends BaseOperation {
  constructor(params, owneryQuery, options, _children) {
    super(params, owneryQuery, options);
    this._children = _children;
  }
  /**
   */
  reset() {
    this.success = false;
    this.done = false;
    for (let i = 0, { length } = this._children; i < length; i++) {
      this._children[i].reset();
    }
  }
  /**
   */
  childrenNext(item, key, owner) {
    let done = true;
    let success = true;
    for (let i = 0, { length } = this._children; i < length; i++) {
      const childOperation = this._children[i];
      childOperation.next(item, key, owner);
      if (!childOperation.success) {
        success = false;
      }
      if (childOperation.done) {
        if (!childOperation.success) {
          break;
        }
      } else {
        done = false;
      }
    }
    // console.log("DONE", this.params, done, success);
    this.done = done;
    this.success = success;
  }
}
exports.GroupOperation = GroupOperation;
class QueryOperation extends GroupOperation {
  /**
   */
  next(item, key, parent) {
    this.childrenNext(item, key, parent);
  }
}
exports.QueryOperation = QueryOperation;
class NestedOperation extends GroupOperation {
  constructor(keyPath, params, owneryQuery, options, children) {
    super(params, owneryQuery, options, children);
    this.keyPath = keyPath;
    /**
     */
    this._nextNestedValue = (value, key, owner) => {
      this.childrenNext(value, key, owner);
      return !this.done;
    };
  }
  /**
   */
  next(item, key, parent) {
    walkKeyPathValues(
      item,
      this.keyPath,
      this._nextNestedValue,
      0,
      key,
      parent
    );
  }
}
exports.NestedOperation = NestedOperation;
exports.createTester = (a, compare) => {
  if (a instanceof Function) {
    return a;
  }
  if (a instanceof RegExp) {
    return b => typeof b === "string" && a.test(b);
  }
  const comparableA = utils_1.comparable(a);
  return b => compare(comparableA, utils_1.comparable(b));
};
class EqualsOperation extends BaseOperation {
  init() {
    this._test = exports.createTester(this.params, this.options.compare);
  }
  next(item, key, parent) {
    if (this._test(item, key, parent)) {
      this.done = true;
      this.success = true;
    }
  }
}
exports.EqualsOperation = EqualsOperation;
exports.createEqualsOperation = (params, owneryQuery, options) =>
  new EqualsOperation(params, owneryQuery, options);
class NopeOperation extends BaseOperation {
  next() {
    this.done = true;
    this.success = false;
  }
}
exports.NopeOperation = NopeOperation;
exports.numericalOperationCreator = createNumericalOperation => (
  params,
  owneryQuery,
  options
) => {
  if (params == null) {
    return new NopeOperation(params, owneryQuery, options);
  }
  return createNumericalOperation(params, owneryQuery, options);
};
exports.numericalOperation = createTester =>
  exports.numericalOperationCreator((params, owneryQuery, options) => {
    const typeofParams = typeof utils_1.comparable(params);
    const test = createTester(params);
    return new EqualsOperation(
      b => {
        return typeof utils_1.comparable(b) === typeofParams && test(b);
      },
      owneryQuery,
      options
    );
  });
const createOperation = (name, params, parentQuery, options) => {
  const operationCreator = options.operations[name];
  if (!operationCreator) {
    throw new Error(`Unsupported operation: ${name}`);
  }
  return operationCreator(params, parentQuery, options);
};
exports.containsOperation = query => {
  for (const key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};
const createNestedOperation = (keyPath, nestedQuery, owneryQuery, options) => {
  if (exports.containsOperation(nestedQuery)) {
    const [selfOperations, nestedOperations] = createQueryOperations(
      nestedQuery,
      options
    );
    if (nestedOperations.length) {
      throw new Error(
        `Property queries must contain only operations, or exact objects.`
      );
    }
    return new NestedOperation(
      keyPath,
      nestedQuery,
      owneryQuery,
      options,
      selfOperations
    );
  }
  return new NestedOperation(keyPath, nestedQuery, owneryQuery, options, [
    new EqualsOperation(nestedQuery, owneryQuery, options)
  ]);
};
exports.createQueryOperation = (query, owneryQuery, options) => {
  const [selfOperations, nestedOperations] = createQueryOperations(
    query,
    options
  );
  const ops = [];
  if (selfOperations.length) {
    ops.push(
      new NestedOperation([], query, owneryQuery, options, selfOperations)
    );
  }
  ops.push(...nestedOperations);
  if (ops.length === 1) {
    return ops[0];
  }
  return new QueryOperation(query, owneryQuery, options, ops);
};
const createQueryOperations = (query, options) => {
  const selfOperations = [];
  const nestedOperations = [];
  if (!utils_1.isVanillaObject(query)) {
    selfOperations.push(new EqualsOperation(query, query, options));
    return [selfOperations, nestedOperations];
  }
  for (const key in query) {
    if (key.charAt(0) === "$") {
      const op = createOperation(key, query[key], query, options);
      // probably just a flag for another operation (like $options)
      if (op != null) {
        selfOperations.push(op);
      }
    } else {
      nestedOperations.push(
        createNestedOperation(key.split("."), query[key], query, options)
      );
    }
  }
  return [selfOperations, nestedOperations];
};
exports.createQueryTester = (query, { compare, operations } = {}) => {
  const operation = exports.createQueryOperation(query, null, {
    compare: compare || utils_1.equals,
    operations: Object.assign({}, operations || {})
  });
  return (item, key, owner) => {
    operation.reset();
    operation.next(item, key, owner);
    return operation.success;
  };
};
//# sourceMappingURL=core.js.map
