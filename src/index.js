"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BUILTIN_OPERATION_FILTERS = {
  $in: function(params, item) {
    return false;
  },
  $eq: function(params, item) {
    return equals(item, params);
  },
  $and: function(params, item) {
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
var equals = function(a, b) {
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
    for (var i = 0, length_1 = a.length; i < length_1; i++) {
      if (!equals(a[i], b[i])) return false;
    }
    return true;
  } else if (isObject(a)) {
    for (var key in a) {
      if (!equals(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};
var getValue = function(root, propertyPath) {
  var current = root;
  if (propertyPath.length === 1) {
    return root[propertyPath[0]];
  }
  for (
    var _i = 0, propertyPath_1 = propertyPath;
    _i < propertyPath_1.length;
    _i++
  ) {
    var pathPart = propertyPath_1[_i];
    current = propertyPath[pathPart];
  }
  return current;
};
var createOperationFilter = function(operation, params, options) {
  var filter =
    (options.expressions && options.expressions[operation]) ||
    BUILTIN_OPERATION_FILTERS[operation];
  if (!filter) {
    throw new Error("Unsupported operation " + operation);
  }
  return function(item) {
    return filter(params, item);
  };
};
var createNestedFilter = function(propertyPath, query, options) {
  var filter = createQueryFilter(query, options);
  return function(item) {
    var nestedItem = getValue(item, propertyPath);
    console.log(item, nestedItem, query);
    return filter(nestedItem);
  };
};
var createQueryFilter = function(query, options) {
  var filters = [];
  for (var property in query) {
    var params = query[property];
    // operation
    if (property.charAt(0) === "$") {
      filters.push(createOperationFilter(property, params, options));
    } else {
      filters.push(createNestedFilter(property.split("."), params, options));
    }
  }
  console.log(filters);
  return function(item) {
    for (var i = filters.length; i--; ) {
      if (!filters[i](item)) return false;
    }
    return true;
  };
};
var createFilter = function(query, options) {
  if (options === void 0) {
    options = {};
  }
  return createQueryFilter(query, options);
};
exports.default = createFilter;
