import { Query } from "./query";
import {
  isArray,
  getValue,
  isVanillaObject,
  equals,
  isFunction,
  comparable
} from "./utils";

type OperationFilter = (params: any, item: any) => boolean;

type CustomOperations = {
  [identifier: string]: OperationFilter;
};

type Options = {
  expressions?: CustomOperations;
};

const or = filter => item => {
  if (!isArray(item) || !item.length) {
    return filter(item);
  }
  for (let i = 0, { length } = item; i < length; i++) {
    if (filter(item[i])) {
      return true;
    }
  }
  return false;
};

const BUILTIN_OPERATION_FILTERS = {
  $in: params => item => false,
  $eq: params => {
    if (params instanceof RegExp) {
      return or(item => {
        return params.test(item);
      });
    }

    if (isFunction(params)) {
      return or(params);
    }

    const comparableParams = comparable(params);
    return or(item => equals(comparableParams, comparable(item)));
  },
  $and: params => item => {
    console.log(params, item);
  },
  $not: params => item => {
    console.log(params, item);
  },
  $regex: regexp => item => {
    console.log(regexp, item);
  },
  $elemMatch: (query, options: Options) => {
    const filter = createAndQueryFilter(query, options);
    return filter;
  },
  $or: (params, options: Options) => {
    const filters = params.map(query => createAndQueryFilter(query, options));
    return item => {
      console.log(params, item);
      for (let i = 0, { length } = params; i < length; i++) {
        if (filters[i](item)) return true;
      }
      return false;
    };
  }
};

const createOperationFilter = (
  operation: string,
  params: any,
  options: Options
): OperationFilter => {
  const createFilter =
    (options.expressions && options.expressions[operation]) ||
    BUILTIN_OPERATION_FILTERS[operation];

  if (!createFilter) {
    throw new Error(`Unsupported operation ${operation}`);
  }

  return createFilter(params, options);
};

const containsOperation = query => {
  for (const key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};

const createNestedFilter = <TItem>(
  propertyPath: string[],
  query: Query<TItem>,
  options: Options
): OperationFilter => {
  const filter = containsOperation(query)
    ? createAndQueryFilter(query, options)
    : (item: TItem) => {
        return equals(comparable(query), comparable(item));
      };

  return (item: TItem) => {
    const nestedItem = getValue(item, propertyPath);
    return filter(nestedItem);
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
      filters.push(createOperationFilter(property, params, options));
    } else {
      console.log(property);
      filters.push(
        createNestedFilter(property.split("."), params as Query<any>, options)
      );
    }
  }

  return filters;
};

const createOrQueryFilter = <TItem>(query: Query<any>, options: Options) => {
  const filters = createQueryFilters(query, options);
  return (item: TItem) => {
    for (let i = filters.length; i--; ) {
      if (filters[i](item)) return true;
    }
    return false;
  };
};

const createAndQueryFilter = <TItem>(query: Query<any>, options: Options) => {
  const filters = createQueryFilters(query, options);
  return (item: TItem) => {
    for (let i = filters.length; i--; ) {
      if (!filters[i](item)) return false;
    }
    return true;
  };
};

const createFilter = <TItem>(query: Query<TItem>, options: Options = {}) => {
  return createAndQueryFilter(query, options);
};

export default createFilter;
