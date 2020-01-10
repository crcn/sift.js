import {
  equals,
  isArray,
  isVanillaObject,
  get,
  isFunction,
  comparable,
  nope
} from "./utils";
import { createNestedFilter } from "./filters";

type Key = string | number;
type Filter = (values: any[], key: Key, parent: any) => boolean;
type Tester = (item: any) => boolean;

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

const spreadValueArray = (params, filter) => (item, key, parent) => {
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

const numericalTester = createFilter => params => {
  const comparableParams = comparable(params);
  if (comparableParams == null) return nope;
  return createFilter(comparableParams);
};

const createRegexpFilter = tester => item =>
  typeof item === "string" && tester.test(item);

const createTester = (params, { compare = equals }) => {
  let tester;
  if (isFunction(params)) {
    return params;
  } else if (params instanceof RegExp) {
    return item => params.test(item);
  } else {
    const comparableParams = comparable(params);
    return item => compare(comparableParams, comparable(item));
  }
};

const createFilter = (params, options) => {
  const test = createTester(params, options);
  return values => {
    return values.every(test);
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
    : createFilter(query, options);

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

  if (depth === scopePath.length || item == null) {
    values.push(item);
    return values;
  }

  if (isArray(item) && isNaN(Number(currentKey))) {
    for (let i = 0, { length } = item; i < length; i++) {
      getScopeValues(get(item, i), scopePath, depth, values);
    }
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
      filters.push(createOperationFilter(property, params, query, options));
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
  params: any,
  parentQuery: Query<any>,
  options: Options
): Filter => {
  const createFilter = options.expressions[operation];

  if (!createFilter) {
    throw new Error(`Unsupported operation ${operation}`);
  }

  return createFilter(params, options, parentQuery);
};

const createAndFilter = <TItem>(filters: Filter[]) => {
  return (values: TItem[], key: Key, parent: any) => {
    for (let i = filters.length; i--; ) {
      if (!filters[i](values, key, parent)) return false;
    }
    return true;
  };
};

const createOrFilter = <TItem>(filters: Filter[]) => {
  return (values: TItem[], key: Key, parent: any) => {
    for (let i = filters.length; i--; ) {
      if (filters[i](values, key, parent)) return true;
    }
    return false;
  };
};

const createPropertyTester = (
  propertyPath: string[],
  query: Query<any>,
  options: Options
) => {
  const { compare } = options;

  if (!containsOperation(query)) {
    const comparableQuery = comparable(query);
    return item => {
      const values = getScopeValues(item, propertyPath);
      return values.some(value => compare(comparable(value), comparableQuery));
    };
  }
  const filters = createQueryFilters2(query, options);

  return item => {
    const values = getScopeValues(item, propertyPath);
    return filters.every(filter => filter(values));
  };
};

const createSelfTester = (filters: Filter[]) => {
  let wrapper = [null];
  return (item: any) => {
    wrapper[0] = item;
    return filters.every(filter => filter(wrapper, null, null));
  };
};

const createQueryTester = (query: Query<any>, options: Options) => {
  const [selfFilters, propTesters] = createQueryParts(query, options);
  const selfTester = createSelfTester(selfFilters);
  return item => {
    return selfTester(item) && propTesters.every(tester => tester(item));
  };
};

const createQueryParts = (query: Query<any>, options: Options) => {
  const selfFilters = [];
  const propTesters = [];

  if (!isVanillaObject(query)) {
    query = { $eq: query };
  }

  for (const property in query) {
    const params = query[property];

    // operation
    if (property.charAt(0) === "$") {
      selfFilters.push(
        createNestedFilter(
          createOperationFilter(property, params, query, options)
        )
      );
    } else {
      propTesters.push(
        createPropertyTester(property.split("."), params as Query<any>, options)
      );
    }
  }

  return [selfFilters, propTesters];
};

const createQueryFilters2 = (query: Query<any>, options: Options) => {
  const [selfFilters, propTesters] = createQueryParts(query, options);
  if (propTesters.length) {
    throw new Error(`Nested properties are unsupported`);
  }
  return selfFilters;
};

export {
  Key,
  Filter,
  Query,
  Tester,
  createTester,
  FilterCreator,
  getScopeValues,
  spreadValueArray,
  createQueryTester,
  createQueryFilters2,
  createPropertyFilter,
  createFilter,
  numericalTester,
  createOrFilter,
  CustomOperations,
  Options,
  createAndFilter,
  createRegexpFilter
};
