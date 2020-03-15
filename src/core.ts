import {
  isArray,
  Key,
  Comparator,
  isVanillaObject,
  comparable,
  equals
} from "./utils";

export interface Operation {
  readonly success: boolean;
  readonly done: boolean;
  reset();
  next(item: any, key: Key, owner: any);
}

export type Tester = (item: any, key?: Key, owner?: any) => boolean;

export type OperationCreator = (
  params: any,
  parentQuery: any,
  options: Options
) => Operation;

export type Query = {
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

  // if array, then try matching. Might fall through for cases like:
  // { $eq: [1, 2, 3] }, [ 1, 2, 3 ].
  if (isArray(item) && isNaN(Number(currentKey))) {
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

export abstract class BaseOperation<TParams> implements Operation {
  success: boolean;
  done: boolean;
  constructor(
    readonly params: TParams,
    readonly owneryQuery: any,
    readonly options: Options
  ) {
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
    owneryQuery: any,
    options: Options,
    protected readonly _children: Operation[]
  ) {
    super(params, owneryQuery, options);
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

  abstract next(item: any, key: Key, owner: any);

  /**
   */

  protected childrenNext(item: any, key: Key, owner: any) {
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
    owneryQuery: any,
    options: Options,
    children: Operation[]
  ) {
    super(params, owneryQuery, options, children);
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
    return b => typeof b === "string" && a.test(b);
  }
  const comparableA = comparable(a);
  return b => compare(comparableA, comparable(b));
};

export class EqualsOperation<TParam> extends BaseOperation<TParam> {
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

export const createEqualsOperation = (
  params: any,
  owneryQuery: any,
  options: Options
) => new EqualsOperation(params, owneryQuery, options);

export class NopeOperation<TParam> extends BaseOperation<TParam> {
  next() {
    this.done = true;
    this.success = false;
  }
}

export const numericalOperationCreator = (
  createNumericalOperation: OperationCreator
) => (params: any, owneryQuery: any, options: Options) => {
  if (params == null) {
    return new NopeOperation(params, owneryQuery, options);
  }

  return createNumericalOperation(params, owneryQuery, options);
};

export const numericalOperation = (createTester: (any) => Tester) =>
  numericalOperationCreator(
    (params: any, owneryQuery: Query, options: Options) => {
      const typeofParams = typeof comparable(params);
      const test = createTester(params);
      return new EqualsOperation(
        b => {
          return typeof comparable(b) === typeofParams && test(b);
        },
        owneryQuery,
        options
      );
    }
  );

export type Options = {
  operations: {
    [identifier: string]: OperationCreator;
  };
  compare: (a, b) => boolean;
};

const createOperation = (
  name: string,
  params: any,
  parentQuery: any,
  options: Options
) => {
  const operationCreator = options.operations[name];
  if (!operationCreator) {
    throw new Error(`Unsupported operation: ${name}`);
  }
  return operationCreator(params, parentQuery, options);
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
  owneryQuery: any,
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

export const createQueryOperation = (
  query: any,
  owneryQuery: any,
  options: Options
) => {
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

const createQueryOperations = (query: any, options: Options) => {
  const selfOperations = [];
  const nestedOperations = [];
  if (!isVanillaObject(query)) {
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

export const createQueryTester = <TItem>(
  query: Query,
  { compare, operations }: Partial<Options> = {}
) => {
  const operation = createQueryOperation(query, null, {
    compare: compare || equals,
    operations: Object.assign({}, operations || {})
  });
  return (item: TItem, key?: Key, owner?: any) => {
    operation.reset();
    operation.next(item, key, owner);
    return operation.success;
  };
};
