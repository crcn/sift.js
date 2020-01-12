import { isArray, Key, Comparator, isVanillaObject } from "./utils";

export interface Operation {
  readonly success: boolean;
  readonly done: boolean;
  reset();
  next(item: any, key: Key, owner: any);
}

export type Tester = (item: any, key?: Key, owner?: any) => boolean;

export type OperationCreator = (params: any, optiosn: Options) => Operation;

/**
 * Walks through each value given the context - used for nested operations. E.g:
 * { "person.address": { $eq: "blarg" }}
 */

const walkKeyPathValues = (
  item: any,
  keyPath: Key[],
  next: Tester,
  depth: number,
  key: Key,
  owner: any
) => {
  const currentKey = keyPath[depth];

  if (isArray(item) && isNaN(Number(currentKey))) {
    for (let i = 0, { length } = item; i < length; i++) {
      // if FALSE is returned, then terminate walker. For operations, this simply
      // means that the search critera was met.
      if (!walkKeyPathValues(item[i], keyPath, next, depth, i, item)) {
        return false;
      }
    }
    return true;
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

export abstract class BaseOperation<TParams> implements Operation {
  success: boolean;
  done: boolean;
  constructor(readonly params: TParams, readonly options: Options) {
    this.init();
  }
  protected init() {}
  reset() {
    this.done = false;
    this.success = false;
  }
  abstract next(item: any, key: Key, parent: any);
}

export abstract class GroupOperation extends BaseOperation<any> {
  success: boolean;
  done: boolean;

  constructor(
    params: any,
    options: Options,
    private readonly _children: Operation[]
  ) {
    super(params, options);
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

  abstract next(item: any, key: Key, parent: any);

  /**
   */

  protected childrenNext(item: any, key: Key, parent: any) {
    let done = true;
    let success = true;
    for (let i = 0, { length } = this._children; i < length; i++) {
      const childOperation = this._children[i];
      childOperation.next(item, key, parent);
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
    this.done = done;
    this.success = success;
  }
}

export class QueryOperation extends GroupOperation {
  /**
   */

  next(item: any, key: Key, parent: any) {
    this.childrenNext(item, key, parent);
  }
}

export class NestedOperation extends GroupOperation {
  constructor(
    readonly keyPath: Key[],
    params: any,
    options: Options,
    children: Operation[]
  ) {
    super(params, options, children);
  }
  /**
   */

  next(item: any, key: Key, parent: any) {
    walkKeyPathValues(
      item,
      this.keyPath,
      this._nextNestedValue,
      0,
      key,
      parent
    );
  }

  /**
   */

  private _nextNestedValue = (value: any, key: Key, owner: any) => {
    this.childrenNext(value, key, owner);
    return !this.done;
  };
}

export const createTester = (a, compare: Comparator) => {
  if (a instanceof Function) {
    return a;
  }
  if (a instanceof RegExp) {
    return b => a.test(b);
  }
  const comparableA = comparable(a);
  return b => compare(comparableA, comparable(b));
};

export const comparable = a => {
  if (a instanceof Date) {
    return a.getTime();
  }
  if (isArray(a)) {
    return a.map(comparable);
  }
  return a;
};

export class EqualsOperation extends BaseOperation<any> {
  private _test: Tester;
  init() {
    this._test = createTester(this.params, this.options.compare);
  }
  next(item, key: Key, parent: any) {
    if (this._test(item, key, parent)) {
      this.done = true;
      this.success = true;
    }
  }
}

export type Options = {
  operations: {
    [identifier: string]: OperationCreator;
  };
  compare: (a, b) => boolean;
};

const createOperation = (name: string, params: any, options: Options) => {
  const operationCreator = options.operations[name];
  if (!operationCreator) {
    throw new Error(`Unsupported operation: ${name}`);
  }
  return operationCreator(params, options);
};

const containsOperation = (query: any) => {
  for (const key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};
const createNestedOperation = (
  keyPath: Key[],
  nestedQuery: any,
  options: Options
) => {
  if (containsOperation(nestedQuery)) {
    const [selfOperations, nestedOperations] = createQueryOperations(
      nestedQuery,
      options
    );
    if (nestedOperations.length) {
      throw new Error(
        `Property queries must contain only operations, or exact objects.`
      );
    }
    return new NestedOperation(keyPath, nestedQuery, options, selfOperations);
  }
  return new NestedOperation(keyPath, nestedQuery, options, [
    new EqualsOperation(nestedQuery, options)
  ]);
};

export const createQueryOperation = (query: any, options: Options) => {
  const [selfOperations, nestedOperations] = createQueryOperations(
    query,
    options
  );
  return new QueryOperation(query, options, [
    ...selfOperations,
    ...nestedOperations
  ]);
};

const createQueryOperations = (query: any, options: Options) => {
  const selfOperations = [];
  const nestedOperations = [];
  if (!isVanillaObject(query)) {
    query = { $eq: query };
  }
  for (const key in query) {
    if (key.charAt(0) === "$") {
      selfOperations.push(createOperation(key, query[key], options));
    } else {
      nestedOperations.push(
        createNestedOperation(key.split("."), query[key], options)
      );
    }
  }
  return [selfOperations, nestedOperations];
};
