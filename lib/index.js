"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var or = function(filter) {
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
var numericalOperation = function(createFilter) {
  return function(params) {
    var comparableParams = utils_1.comparable(params);
    if (comparableParams == null) return utils_1.nope;
    return or(createFilter(comparableParams));
  };
};
var createRegexpTester = function(tester) {
  return function(item) {
    return typeof item === "string" && tester.test(item);
  };
};
var BUILTIN_OPERATION_FILTERS = {
  $eq: function(params, options) {
    return or(createTester(params, options));
  },
  $ne: function(params, options) {
    var $eq = BUILTIN_OPERATION_FILTERS.$eq(params, options);
    return function(item, key, parent) {
      return !$eq(item, key, parent);
    };
  },
  $gt: numericalOperation(function(params) {
    return function(item) {
      return utils_1.comparable(item) > params;
    };
  }),
  $gte: numericalOperation(function(params) {
    return function(item) {
      return utils_1.comparable(item) >= params;
    };
  }),
  $lt: numericalOperation(function(params) {
    return function(item) {
      return utils_1.comparable(item) < params;
    };
  }),
  $lte: numericalOperation(function(params) {
    return function(item) {
      return utils_1.comparable(item) <= params;
    };
  }),
  $mod: numericalOperation(function(_a) {
    var mod = _a[0],
      equalsValue = _a[1];
    return function(item) {
      return utils_1.comparable(item) % mod === equalsValue;
    };
  }),
  $exists: function(params) {
    return or(function(item, key, parent) {
      return parent.hasOwnProperty(key) === params;
    });
  },
  $in: function(params, options) {
    var filter = BUILTIN_OPERATION_FILTERS.$or(params, options);
    return function(item, key, parent) {
      return filter(item, key, parent);
    };
  },
  $nin: function(params, options) {
    var filter = BUILTIN_OPERATION_FILTERS.$in(params, options);
    return function(item, key, value) {
      return !filter(item, key, value);
    };
  },
  $and: function(params, options) {
    var filter = createAndFilter(
      params.map(function(query) {
        return createOrFilter(createQueryFilters(query, options));
      })
    );
    return filter;
  },
  $options: function(params) {
    return function(item) {
      return true;
    };
  },
  $not: function(query, options) {
    var filter = createAndFilter(createQueryFilters(query, options));
    return function(item, key, parent) {
      return !filter(item, key, parent);
    };
  },
  $size: function(size) {
    return function(item) {
      return item && item.length === size;
    };
  },
  $all: function(query, options) {
    return BUILTIN_OPERATION_FILTERS.$and(query, options);
  },
  $type: function(clazz) {
    return or(function(item) {
      return item == undefined
        ? false
        : item instanceof clazz || item.constructor === clazz;
    });
  },
  $regex: function(pattern, options, _a) {
    var $options = _a.$options;
    var tester =
      pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
    return or(createRegexpTester(tester));
  },
  $elemMatch: function(query, options) {
    var filter = createAndFilter(createQueryFilters(query, options));
    return filter;
  },
  $or: function(params, options) {
    return createOrFilter(
      params.map(function(query) {
        return createAndFilter(createQueryFilters(query, options));
      })
    );
  },
  $nor: function(params, options) {
    var filter = BUILTIN_OPERATION_FILTERS.$or(params, options);
    return function(item, key, parent) {
      return !filter(item, key, parent);
    };
  },
  $where: function(query) {
    var tester;
    if (utils_1.isFunction(query)) {
      tester = query;
    } else if (!process.env.CSP_ENABLED) {
      tester = new Function("obj", "return " + query);
    } else {
      throw new Error(
        'In CSP mode, sift does not support strings in "$where" condition'
      );
    }
    return function(item) {
      return tester.bind(item)(item);
    };
  }
};
var createOperationFilter = function(operation, params, parentQuery, options) {
  var createFilter =
    (options.expressions && options.expressions[operation]) ||
    BUILTIN_OPERATION_FILTERS[operation];
  if (!createFilter) {
    throw new Error("Unsupported operation " + operation);
  }
  return createFilter(params, options, parentQuery);
};
var containsOperation = function(query) {
  for (var key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};
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
var createOrFilter = function(filters) {
  return function(item, key, parent) {
    for (var i = filters.length; i--; ) {
      if (filters[i](item, key, parent)) return true;
    }
    return false;
  };
};
var createAndFilter = function(filters) {
  return function(item, key, parent) {
    for (var i = filters.length; i--; ) {
      if (!filters[i](item, key, parent)) return false;
    }
    return true;
  };
};
var createFilter = function(query, options) {
  if (options === void 0) {
    options = {};
  }
  return createAndFilter(createQueryFilters(query, options));
};
exports.default = createFilter;
