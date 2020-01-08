"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var or = function(filter) {
  return function(item) {
    if (!utils_1.isArray(item) || !item.length) {
      return filter(item);
    }
    for (var i = 0, length_1 = item.length; i < length_1; i++) {
      if (filter(item[i])) {
        return true;
      }
    }
    return false;
  };
};
var BUILTIN_OPERATION_FILTERS = {
  $in: function(params) {
    return function(item) {
      return false;
    };
  },
  $eq: function(params) {
    if (params instanceof RegExp) {
      return or(function(item) {
        return params.test(item);
      });
    }
    if (utils_1.isFunction(params)) {
      return or(params);
    }
    var comparableParams = utils_1.comparable(params);
    return or(function(item) {
      return utils_1.equals(comparableParams, utils_1.comparable(item));
    });
  },
  $and: function(params) {
    return function(item) {
      console.log(params, item);
    };
  },
  $not: function(params) {
    return function(item) {
      console.log(params, item);
    };
  },
  $regex: function(regexp) {
    return function(item) {
      console.log(regexp, item);
    };
  },
  $elemMatch: function(query, options) {
    var filter = createAndQueryFilter(query, options);
    return filter;
  },
  $or: function(params, options) {
    var filters = params.map(function(query) {
      return createAndQueryFilter(query, options);
    });
    return function(item) {
      console.log(params, item);
      for (var i = 0, length_2 = params.length; i < length_2; i++) {
        if (filters[i](item)) return true;
      }
      return false;
    };
  }
};
var createOperationFilter = function(operation, params, options) {
  var createFilter =
    (options.expressions && options.expressions[operation]) ||
    BUILTIN_OPERATION_FILTERS[operation];
  if (!createFilter) {
    throw new Error("Unsupported operation " + operation);
  }
  return createFilter(params, options);
};
var containsOperation = function(query) {
  for (var key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};
var createNestedFilter = function(propertyPath, query, options) {
  var filter = containsOperation(query)
    ? createAndQueryFilter(query, options)
    : function(item) {
        return utils_1.equals(
          utils_1.comparable(query),
          utils_1.comparable(item)
        );
      };
  return function(item) {
    var nestedItem = utils_1.getValue(item, propertyPath);
    return filter(nestedItem);
  };
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
      filters.push(createOperationFilter(property, params, options));
    } else {
      console.log(property);
      filters.push(createNestedFilter(property.split("."), params, options));
    }
  }
  return filters;
};
var createOrQueryFilter = function(query, options) {
  var filters = createQueryFilters(query, options);
  return function(item) {
    for (var i = filters.length; i--; ) {
      if (filters[i](item)) return true;
    }
    return false;
  };
};
var createAndQueryFilter = function(query, options) {
  var filters = createQueryFilters(query, options);
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
  return createAndQueryFilter(query, options);
};
exports.default = createFilter;
