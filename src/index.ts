import { Query } from "./query";
import {
  isArray,
  get,
  nope,
  hasNestedProperty,
  isVanillaObject,
  equals,
  isFunction,
  comparable
} from "./utils";

type FilterCreator = (params: any) => (item: any) => boolean;

type CustomOperations = {
  [identifier: string]: FilterCreator;
};

type Filter = (item: any, key: Key, parent: any) => boolean;

type Key = string | number;

type Options = {
  expressions?: CustomOperations;
  compare?: (a, b) => boolean;
};

const or = filter => (item, key, parent) => {
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
  return or(createFilter(comparableParams));
};

const createRegexpTester = tester => item =>
  typeof item === "string" && tester.test(item);

const BUILTIN_OPERATION_FILTERS = {
  $eq: (params, options) => or(createTester(params, options)),
  $ne: (params, options) => {
    const $eq = BUILTIN_OPERATION_FILTERS.$eq(params, options);
    return (item, key, parent) => {
      return !$eq(item, key, parent);
    };
  },
  $gt: numericalOperation(params => item => comparable(item) > params),
  $gte: numericalOperation(params => item => comparable(item) >= params),
  $lt: numericalOperation(params => item => comparable(item) < params),
  $lte: numericalOperation(params => item => comparable(item) <= params),
  $mod: numericalOperation(([mod, equalsValue]) => item =>
    comparable(item) % mod === equalsValue
  ),
  $exists: params =>
    or((item, key, parent) => {
      return parent.hasOwnProperty(key) === params;
    }),
  $in: (params, options) => {
    const filter = BUILTIN_OPERATION_FILTERS.$or(params, options);
    return (item, key, parent) => {
      return filter(item, key, parent);
    };
  },
  $nin: (params, options) => {
    const filter = BUILTIN_OPERATION_FILTERS.$in(params, options);
    return (item, key, value) => {
      return !filter(item, key, value);
    };
  },
  $and: (params, options) => {
    const filter = createAndFilter(
      params.map(query => createOrFilter(createQueryFilters(query, options)))
    );
    return filter;
  },
  $options: params => item => true,
  $not: (query, options) => {
    const filter = createAndFilter(createQueryFilters(query, options));
    return (item, key, parent) => !filter(item, key, parent);
  },
  $size: size => item => item && item.length === size,
  $all: (query, options) => {
    return BUILTIN_OPERATION_FILTERS.$and(query, options);
  },
  $type: clazz =>
    or(item => {
      return item == undefined
        ? false
        : item instanceof clazz || item.constructor === clazz;
    }),
  $regex: (pattern, options, { $options }) => {
    const tester =
      pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
    return or(createRegexpTester(tester));
  },
  $elemMatch: (query, options: Options) => {
    const filter = createAndFilter(createQueryFilters(query, options));
    return filter;
  },
  $or: (params, options: Options) => {
    return createOrFilter(
      params.map(query => createAndFilter(createQueryFilters(query, options)))
    );
  },
  $nor: (params, options: Options) => {
    const filter = BUILTIN_OPERATION_FILTERS.$or(params, options);
    return (item, key, parent) => !filter(item, key, parent);
  },
  $where: query => {
    let tester;

    if (isFunction(query)) {
      tester = query;
    } else if (!process.env.CSP_ENABLED) {
      tester = new Function("obj", "return " + query);
    } else {
      throw new Error(
        'In CSP mode, sift does not support strings in "$where" condition'
      );
    }

    return item => tester.bind(item)(item);
  }
};

const createOperationFilter = (
  operation: string,
  params: any,
  parentQuery: Query<any>,
  options: Options
): Filter => {
  const createFilter =
    (options.expressions && options.expressions[operation]) ||
    BUILTIN_OPERATION_FILTERS[operation];

  if (!createFilter) {
    throw new Error(`Unsupported operation ${operation}`);
  }

  return createFilter(params, options, parentQuery);
};

const containsOperation = query => {
  for (const key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};

const createTester = (params, { compare = equals }) => {
  if (isFunction(params)) {
    return params;
  }
  if (params instanceof RegExp) {
    return createRegexpTester(params);
  }
  const comparableParams = comparable(params);
  return (item, key: Key, parent: any) => {
    return compare(comparableParams, comparable(item));
  };
};

const createNestedFilter = <TItem>(
  property: string,
  query: Query<TItem>,
  options: Options
): Filter => {
  const filter = containsOperation(query)
    ? createAndFilter(createQueryFilters(query, options))
    : createTester(query, options);

  const pathParts = property.split(".");

  const filterNested = (
    item: any,
    keyPath: Key[],
    parent: any,
    depth: number
  ): boolean => {
    const currentKey = keyPath[depth];

    if (isArray(item)) {
      for (let i = 0, { length } = item; i < length; i++) {
        if (filterNested(get(item, i), keyPath, parent, depth)) {
          return true;
        }
      }
    }

    const child = get(item, currentKey);

    if (item && child == null) {
      return filter(undefined, currentKey, item);
    }

    if (depth === keyPath.length - 1) {
      return filter(child, currentKey, item);
    }

    return filterNested(child, keyPath, item, depth + 1);
  };

  return (item: TItem, key: Key, parent: any) => {
    return filterNested(item, pathParts, parent, 0);
  };
};

const createQueryFilters = <TItem>(query: Query<TItem>, options: Options) => {
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
      filters.push(createNestedFilter(property, params as Query<any>, options));
    }
  }

  return filters;
};

const createOrFilter = <TItem>(filters: Filter[]) => {
  return (item: TItem, key: Key, parent: any) => {
    for (let i = filters.length; i--; ) {
      if (filters[i](item, key, parent)) return true;
    }
    return false;
  };
};

const createAndFilter = <TItem>(filters: Filter[]) => {
  return (item: TItem, key: Key, parent: any) => {
    for (let i = filters.length; i--; ) {
      if (!filters[i](item, key, parent)) return false;
    }
    return true;
  };
};

const createFilter = <TItem>(query: Query<TItem>, options: Options = {}) => {
  return createAndFilter(createQueryFilters(query, options));
};

export default createFilter;
