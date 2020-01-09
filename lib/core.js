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
var createTester = function(params, _a) {
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
    return compare(comparableParams, utils_1.comparable(item));
  };
};
exports.createTester = createTester;
var createNestedFilter = function(property, query, options) {
  var filter = containsOperation(query)
    ? createAndFilter(createQueryFilters(query, options))
    : createTester(query, options);
  var pathParts = property.split(".");
  // If the query contains $ne, need to test all elements ANDed together
  var inclusive = query && query.$ne != null;
  return function(item, key, parent) {
    return filterNested(filter, inclusive, item, pathParts, parent, 0);
  };
};
exports.createNestedFilter = createNestedFilter;
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
var createQueryFilters = function(query, options) {
  var filters = [];
  if (!utils_1.isVanillaObject(query)) {
    query = { $eq: query };
  }
  for (var property in query) {
    var params = query[property];
    // operation
    if (property.charAt(0) === "$") {
      filters.push(createOperationFilter(property, params, query, options));
    } else {
      filters.push(createNestedFilter(property, params, options));
    }
  }
  return filters;
};
exports.createQueryFilters = createQueryFilters;
var createOperationFilter = function(operation, params, parentQuery, options) {
  var createFilter = options.expressions[operation];
  if (!createFilter) {
    throw new Error("Unsupported operation " + operation);
  }
  return createFilter(params, options, parentQuery);
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
