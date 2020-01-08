import { Query } from "./query";

type OperationFilter = (params: any, item: any) => boolean;

type CustomOperations = {
  [identifier: string]: OperationFilter;
};

type Options = {
  expressions?: CustomOperations;
};

const BUILTIN_OPERATION_FILTERS = {
  $in: (params, item) => false,
  $eq: (params, item) => equals(item, params),
  $and: (params, item) => {
    console.log(params, item);
  }
};

function typeChecker(type) {
  var typeString = "[object " + type + "]";
  return function(value) {
    return Object.prototype.toString.call(value) === typeString;
  };
}

/**
 */

var isArray = typeChecker("Array");
var isObject = typeChecker("Object");
var isFunction = typeChecker("Function");

const equals = (a, b) => {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, { length } = a; i < length; i++) {
      if (!equals(a[i], b[i])) return false;
    }
    return true;
  } else if (isObject(a)) {
    for (const key in a) {
      if (!equals(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};

const getValue = (root: any, propertyPath: string[]) => {
  let current = root;
  if (propertyPath.length === 1) {
    return root[propertyPath[0]];
  }
  for (const pathPart of propertyPath) {
    current = propertyPath[pathPart];
  }
  return current;
};

const createOperationFilter = (
  operation: string,
  params: any,
  options: Options
): OperationFilter => {
  const filter =
    (options.expressions && options.expressions[operation]) ||
    BUILTIN_OPERATION_FILTERS[operation];

  if (!filter) {
    throw new Error(`Unsupported operation ${operation}`);
  }

  return item => filter(params, item);
};

const createNestedFilter = <TItem>(
  propertyPath: string[],
  query: Query<TItem>,
  options: Options
): OperationFilter => {
  const filter = createQueryFilter(query, options);
  return (item: TItem) => {
    const nestedItem = getValue(item, propertyPath);
    console.log(item, nestedItem, query);
    return filter(nestedItem);
  };
};

const createQueryFilter = <TItem>(query: Query<TItem>, options: Options) => {
  const filters = [];

  for (const property in query) {
    const params = query[property];

    // operation
    if (property.charAt(0) === "$") {
      filters.push(createOperationFilter(property, params, options));
    } else {
      filters.push(
        createNestedFilter(property.split("."), params as Query<any>, options)
      );
    }
  }

  console.log(filters);

  return (item: TItem) => {
    for (let i = filters.length; i--; ) {
      if (!filters[i](item)) return false;
    }
    return true;
  };
};

const createFilter = <TItem>(query: Query<TItem>, options: Options = {}) => {
  return createQueryFilter(query, options);
};

export default createFilter;
