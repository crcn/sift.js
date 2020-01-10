"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var filters_1 = require("./filters");
var containsOperation = function(query) {
  for (var key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};
var spreadValueArray = function(params, filter) {
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
var numericalTester = function(createFilter) {
  return function(params) {
    var comparableParams = utils_1.comparable(params);
    if (comparableParams == null) return utils_1.nope;
    return createFilter(comparableParams);
  };
};
exports.numericalTester = numericalTester;
var createRegexpFilter = function(tester) {
  return function(item) {
    return typeof item === "string" && tester.test(item);
  };
};
exports.createRegexpFilter = createRegexpFilter;
var createTester = function(params, _a) {
  var _b = _a.compare,
    compare = _b === void 0 ? utils_1.equals : _b;
  var tester;
  if (utils_1.isFunction(params)) {
    return params;
  } else if (params instanceof RegExp) {
    return function(item) {
      return params.test(item);
    };
  } else {
    var comparableParams_1 = utils_1.comparable(params);
    return function(item) {
      return compare(comparableParams_1, utils_1.comparable(item));
    };
  }
};
exports.createTester = createTester;
var createFilter = function(params, options) {
  var test = createTester(params, options);
  return function(values) {
    return values.every(test);
  };
};
exports.createFilter = createFilter;
var createPropertyFilter = function(property, query, options) {
  var pathParts = property.split(".");
  var filter = containsOperation(query)
    ? createAndFilter(createQueryFilters(query, pathParts, options))
    : createFilter(query, options);
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
  if (depth === scopePath.length || item == null) {
    values.push(item);
    return values;
  }
  if (utils_1.isArray(item) && isNaN(Number(currentKey))) {
    for (var i = 0, length_3 = item.length; i < length_3; i++) {
      getScopeValues(utils_1.get(item, i), scopePath, depth, values);
    }
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
      filters.push(createOperationFilter(property, params, query, options));
    } else {
      filters.push(createPropertyFilter(property, params, options));
    }
  }
  return filters;
};
var createOperationFilter = function(operation, params, parentQuery, options) {
  var createFilter = options.expressions[operation];
  if (!createFilter) {
    throw new Error("Unsupported operation " + operation);
  }
  return createFilter(params, options, parentQuery);
};
var createAndFilter = function(filters) {
  return function(values, key, parent) {
    for (var i = filters.length; i--; ) {
      if (!filters[i](values, key, parent)) return false;
    }
    return true;
  };
};
exports.createAndFilter = createAndFilter;
var createOrFilter = function(filters) {
  return function(values, key, parent) {
    for (var i = filters.length; i--; ) {
      if (filters[i](values, key, parent)) return true;
    }
    return false;
  };
};
exports.createOrFilter = createOrFilter;
var createPropertyTester = function(propertyPath, query, options) {
  var compare = options.compare;
  if (!containsOperation(query)) {
    var comparableQuery_1 = utils_1.comparable(query);
    return function(item) {
      var values = getScopeValues(item, propertyPath);
      return values.some(function(value) {
        return compare(utils_1.comparable(value), comparableQuery_1);
      });
    };
  }
  var filters = createQueryFilters2(query, options);
  return function(item) {
    var values = getScopeValues(item, propertyPath);
    return filters.every(function(filter) {
      return filter(values);
    });
  };
};
var createSelfTester = function(filters) {
  var wrapper = [null];
  return function(item) {
    wrapper[0] = item;
    return filters.every(function(filter) {
      return filter(wrapper, null, null);
    });
  };
};
var createQueryTester = function(query, options) {
  var _a = createQueryParts(query, options),
    selfFilters = _a[0],
    propTesters = _a[1];
  var selfTester = createSelfTester(selfFilters);
  return function(item) {
    return (
      selfTester(item) &&
      propTesters.every(function(tester) {
        return tester(item);
      })
    );
  };
};
exports.createQueryTester = createQueryTester;
var createQueryParts = function(query, options) {
  var selfFilters = [];
  var propTesters = [];
  if (!utils_1.isVanillaObject(query)) {
    query = { $eq: query };
  }
  for (var property in query) {
    var params = query[property];
    // operation
    if (property.charAt(0) === "$") {
      selfFilters.push(
        filters_1.createNestedFilter(
          createOperationFilter(property, params, query, options)
        )
      );
    } else {
      propTesters.push(
        createPropertyTester(property.split("."), params, options)
      );
    }
  }
  return [selfFilters, propTesters];
};
var createQueryFilters2 = function(query, options) {
  var _a = createQueryParts(query, options),
    selfFilters = _a[0],
    propTesters = _a[1];
  if (propTesters.length) {
    throw new Error("Nested properties are unsupported");
  }
  return selfFilters;
};
exports.createQueryFilters2 = createQueryFilters2;
