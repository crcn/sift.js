"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var containsOperation = function(query) {
  for (var key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};
var spreadValueArray = function(filter) {
  return function(item, key, parent) {
    if (!utils_1.isArray(item) || !item.length) {
      return filter(item, key, parent);
    }
    for (var i = 0, length_1 = item.length; i < length_1; i++) {
      if (filter(utils_1.get(item, i), key, parent)) {
        return true;
      }
    }
    return false;
  };
};
exports.spreadValueArray = spreadValueArray;
var numericalOperation = function(createFilter) {
  return function(params) {
    var comparableParams = utils_1.comparable(params);
    if (comparableParams == null) return utils_1.nope;
    return spreadValueArray(createFilter(comparableParams));
  };
};
exports.numericalOperation = numericalOperation;
var createRegexpTester = function(tester) {
  return function(item) {
    return typeof item === "string" && tester.test(item);
  };
};
exports.createRegexpTester = createRegexpTester;
var createTester = function(params, scopePath, _a) {
  var _b = _a.compare,
    compare = _b === void 0 ? utils_1.equals : _b;
  if (utils_1.isFunction(params)) {
    return params;
  }
  if (params instanceof RegExp) {
    return createRegexpTester(params);
  }
  var comparableParams = utils_1.comparable(params);
  return function(item, key, parent) {
    console.log(
      item,
      scopePath,
      getScopeValues(item, scopePath),
      comparableParams
    );
    return getScopeValues(item, scopePath).some(function(value) {
      return compare(comparableParams, utils_1.comparable(value));
    });
  };
};
exports.createTester = createTester;
var createPropertyFilter = function(property, query, options) {
  var pathParts = property.split(".");
  var filter = containsOperation(query)
    ? createAndFilter(createQueryFilters(query, pathParts, options))
    : createTester(query, pathParts, options);
  // If the query contains $ne, need to test all elements ANDed together
  // const inclusive = query && (query.$ne != null || query.$all != null);
  return filter;
  // return (item: TItem, key: Key, parent: any) => {
  //   return filterNested(filter, inclusive, item, pathParts, parent, 0);
  // };
};
exports.createPropertyFilter = createPropertyFilter;
var filterNested = function(filter, inclusive, item, keyPath, parent, depth) {
  var currentKey = keyPath[depth];
  if (utils_1.isArray(item) && isNaN(Number(currentKey))) {
    var allValid = void 0;
    for (var i = 0, length_2 = item.length; i < length_2; i++) {
      var include = filterNested(
        filter,
        inclusive,
        utils_1.get(item, i),
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
  var child = utils_1.get(item, currentKey);
  if (item && child == null) {
    return filter(undefined, currentKey, item);
  }
  if (depth === keyPath.length - 1) {
    return filter(child, currentKey, item);
  }
  return filterNested(filter, inclusive, child, keyPath, item, depth + 1);
};
var getScopeValues = function(item, scopePath, depth, values) {
  if (depth === void 0) {
    depth = 0;
  }
  if (values === void 0) {
    values = [];
  }
  var currentKey = scopePath[depth];
  if (utils_1.isArray(item) && isNaN(Number(currentKey))) {
    for (var i = 0, length_3 = item.length; i < length_3; i++) {
      getScopeValues(utils_1.get(item, i), scopePath, depth, values);
    }
    return values;
  }
  if (depth === scopePath.length || item == null) {
    values.push(item);
    return values;
  }
  return getScopeValues(
    utils_1.get(item, currentKey),
    scopePath,
    depth + 1,
    values
  );
};
exports.getScopeValues = getScopeValues;
var createQueryFilters = function(query, scopePath, options) {
  var filters = [];
  if (!utils_1.isVanillaObject(query)) {
    query = { $eq: query };
  }
  for (var property in query) {
    var params = query[property];
    // operation
    if (property.charAt(0) === "$") {
      filters.push(
        createOperationFilter(property, scopePath, params, query, options)
      );
    } else {
      filters.push(createPropertyFilter(property, params, options));
    }
  }
  return filters;
};
exports.createQueryFilters = createQueryFilters;
var createOperationFilter = function(
  operation,
  scopePath,
  params,
  parentQuery,
  options
) {
  var createFilter = options.expressions[operation];
  if (!createFilter) {
    throw new Error("Unsupported operation " + operation);
  }
  return createFilter(params, scopePath, options, parentQuery);
};
var createAndFilter = function(filters) {
  return function(item, key, parent) {
    for (var i = filters.length; i--; ) {
      if (!filters[i](item, key, parent)) return false;
    }
    return true;
  };
};
exports.createAndFilter = createAndFilter;
var createOrFilter = function(filters) {
  return function(item, key, parent) {
    for (var i = filters.length; i--; ) {
      if (filters[i](item, key, parent)) return true;
    }
    return false;
  };
};
exports.createOrFilter = createOrFilter;
