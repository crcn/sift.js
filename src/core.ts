import {
  equals,
  isArray,
  isVanillaObject,
  get,
  isFunction,
  comparable,
  nope
} from "./utils";

type Key = string | number;
type Filter = (item: any, key: Key, parent: any) => boolean;

type $And = any;

type $Or = any;

type FieldQuery = any;

type $Eq = any;

type Query<TItem> = {
  $and?: $And;
  $or?: $Or;
  $eq?: $Eq;
  [identifier: string]: FieldQuery;
};
type FilterCreator = (
  params: any,
  scopePath: string[],
  options: Options,
  parentQuery: Query<any>
) => (item: any) => boolean;

type CustomOperations = {
  [identifier: string]: FilterCreator;
};

type Options = {
  expressions: CustomOperations;
  compare: (a, b) => boolean;
};

const containsOperation = query => {
  for (const key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};

const spreadValueArray = filter => (item, key, parent) => {
  if (!isArray(item) || !item.length) {
    return filter(item, key, parent);
  }
  for (let i = 0, { length } = item; i < length; i++) {
    if (filter(get(item, i), key, parent)) {
      return true;
    }
  }
  return false;
};

const numericalOperation = createFilter => params => {
  const comparableParams = comparable(params);
  if (comparableParams == null) return nope;
  return spreadValueArray(createFilter(comparableParams));
};

const createRegexpTester = tester => item =>
  typeof item === "string" && tester.test(item);

const createTester = (params, scopePath: string[], { compare = equals }) => {
  if (isFunction(params)) {
    return params;
  }
  if (params instanceof RegExp) {
    return createRegexpTester(params);
  }
  const comparableParams = comparable(params);
  return (item, key: Key, parent: any) => {
    console.log(
      item,
      scopePath,
      getScopeValues(item, scopePath),
      comparableParams
    );
    return getScopeValues(item, scopePath).some(value =>
      compare(comparableParams, comparable(value))
    );
  };
};

const createPropertyFilter = <TItem>(
  property: string,
  query: Query<TItem>,
  options: Options
): Filter => {
  const pathParts = property.split(".");

  const filter = containsOperation(query)
    ? createAndFilter(createQueryFilters(query, pathParts, options))
    : createTester(query, pathParts, options);

  // If the query contains $ne, need to test all elements ANDed together
  // const inclusive = query && (query.$ne != null || query.$all != null);

  return filter;

  // return (item: TItem, key: Key, parent: any) => {
  //   return filterNested(filter, inclusive, item, pathParts, parent, 0);
  // };
};

const filterNested = (
  filter: Filter,
  inclusive: boolean,
  item: any,
  keyPath: Key[],
  parent: any,
  depth: number
): boolean => {
  const currentKey = keyPath[depth];

  if (isArray(item) && isNaN(Number(currentKey))) {
    let allValid;
    for (let i = 0, { length } = item; i < length; i++) {
      const include = filterNested(
        filter,
        inclusive,
        get(item, i),
        keyPath,
        parent,
        depth
      );
      if (inclusive && allValid != null) {
        allValid = allValid && include;
      } else {
        allValid = allValid || include;
      }
    }
    return allValid;
  }

  const child = get(item, currentKey);

  if (item && child == null) {
    return filter(undefined, currentKey, item);
  }

  if (depth === keyPath.length - 1) {
    return filter(child, currentKey, item);
  }

  return filterNested(filter, inclusive, child, keyPath, item, depth + 1);
};

const getScopeValues = (
  item,
  scopePath: string[],
  depth: number = 0,
  values: any[] = []
) => {
  const currentKey = scopePath[depth];
  if (isArray(item) && isNaN(Number(currentKey))) {
    for (let i = 0, { length } = item; i < length; i++) {
      getScopeValues(get(item, i), scopePath, depth, values);
    }
    return values;
  }
  if (depth === scopePath.length || item == null) {
    values.push(item);
    return values;
  }

  return getScopeValues(get(item, currentKey), scopePath, depth + 1, values);
};

const createQueryFilters = <TItem>(
  query: Query<TItem>,
  scopePath: string[],
  options: Options
) => {
  const filters = [];
  if (!isVanillaObject(query)) {
    query = { $eq: query };
  }

  for (const property in query) {
    const params = query[property];

    // operation
    if (property.charAt(0) === "$") {
      filters.push(
        createOperationFilter(property, scopePath, params, query, options)
      );
    } else {
      filters.push(
        createPropertyFilter(property, params as Query<any>, options)
      );
    }
  }

  return filters;
};

const createOperationFilter = (
  operation: string,
  scopePath: string[],
  params: any,
  parentQuery: Query<any>,
  options: Options
): Filter => {
  const createFilter = options.expressions[operation];

  if (!createFilter) {
    throw new Error(`Unsupported operation ${operation}`);
  }

  return createFilter(params, scopePath, options, parentQuery);
};

const createAndFilter = <TItem>(filters: Filter[]) => {
  return (item: TItem, key: Key, parent: any) => {
    for (let i = filters.length; i--; ) {
      if (!filters[i](item, key, parent)) return false;
    }
    return true;
  };
};

const createOrFilter = <TItem>(filters: Filter[]) => {
  return (item: TItem, key: Key, parent: any) => {
    for (let i = filters.length; i--; ) {
      if (filters[i](item, key, parent)) return true;
    }
    return false;
  };
};

export {
  Key,
  Filter,
  Query,
  FilterCreator,
  getScopeValues,
  spreadValueArray,
  createQueryFilters,
  createPropertyFilter,
  createTester,
  numericalOperation,
  createOrFilter,
  CustomOperations,
  Options,
  createAndFilter,
  createRegexpTester
};
