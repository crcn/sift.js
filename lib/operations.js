"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var core_1 = require("./core");
var $eq = function(params, scopePath, options) {
  return core_1.createTester(params, scopePath, options);
};
exports.$eq = $eq;
var $ne = function(params, scopePath, options) {
  var filter = $eq(params, scopePath, options);
  return function(item, key, parent) {
    return !filter(item, key, parent);
  };
};
exports.$ne = $ne;
var $gt = core_1.numericalOperation(function(params) {
  return function(item) {
    return utils_1.comparable(item) > params;
  };
});
exports.$gt = $gt;
var $gte = core_1.numericalOperation(function(params) {
  return function(item) {
    return utils_1.comparable(item) >= params;
  };
});
exports.$gte = $gte;
var $lt = core_1.numericalOperation(function(params) {
  return function(item) {
    return utils_1.comparable(item) < params;
  };
});
exports.$lt = $lt;
var $lte = core_1.numericalOperation(function(params) {
  return function(item) {
    return utils_1.comparable(item) <= params;
  };
});
exports.$lte = $lte;
var $mod = core_1.numericalOperation(function(_a) {
  var mod = _a[0],
    equalsValue = _a[1];
  return function(item) {
    return utils_1.comparable(item) % mod === equalsValue;
  };
});
exports.$mod = $mod;
var $exists = function(params) {
  return core_1.spreadValueArray(function(_item, key, parent) {
    return parent.hasOwnProperty(key) === params;
  });
};
exports.$exists = $exists;
var $in = function(params, scopePath, options) {
  var filter = $or(params, scopePath, options);
  return function(item, key, parent) {
    return filter(item, key, parent);
  };
};
exports.$in = $in;
var $nin = function(params, scopePath, options) {
  var filter = $in(params, scopePath, options);
  return function(item, key, value) {
    return !filter(item, key, value);
  };
};
exports.$nin = $nin;
var $and = function(queries, scopePath, options) {
  var filters = queries.map(function(query) {
    return core_1.createOrFilter(core_1.createQueryFilters(query, [], options));
  });
  return function(item) {
    var values = core_1.getScopeValues(item, scopePath);
    return filters.every(function(filter) {
      return values.some(filter);
    });
  };
};
exports.$and = $and;
var $options = function() {
  return function() {
    return true;
  };
};
exports.$options = $options;
var $not = function(query, scopePath, options) {
  var filter = core_1.createAndFilter(
    core_1.createQueryFilters(query, scopePath, options)
  );
  return function(item, key, parent) {
    return !filter(item, key, parent);
  };
};
exports.$not = $not;
var $size = function(size) {
  return function(item) {
    return item && item.length === size;
  };
};
exports.$size = $size;
var $all = function(queries, scopePath, options) {
  var filter = $and(queries, scopePath, options);
  return function(item, key, parent) {
    return filter(item);
  };
};
exports.$all = $all;
var traverseScope = function(item, scopePath, depth) {
  if (depth === void 0) {
    depth = 0;
  }
  if (depth === scopePath.length) {
    return item;
  }
  var currentKey = scopePath[depth];
  if (utils_1.isArray(item) && isNaN(Number(currentKey))) {
    for (var i = 0, length_1 = item.length; i < length_1; i++) {
      traverseScope(item[i], scopePath, depth);
    }
  }
};
var $type = function(clazz) {
  return core_1.spreadValueArray(function(item) {
    return item == undefined
      ? false
      : item instanceof clazz || item.constructor === clazz;
  });
};
exports.$type = $type;
var $regex = function(pattern, _scopePath, _options, _a) {
  var $options = _a.$options;
  var tester =
    pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
  return core_1.spreadValueArray(core_1.createRegexpTester(tester));
};
exports.$regex = $regex;
var $elemMatch = function(query, scopePath, options) {
  var filter = core_1.createAndFilter(
    core_1.createQueryFilters(query, scopePath, options)
  );
  return filter;
};
exports.$elemMatch = $elemMatch;
var $or = function(queries, scopePath, options) {
  return core_1.createOrFilter(
    queries.map(function(query) {
      return core_1.createAndFilter(
        core_1.createQueryFilters(query, scopePath, options)
      );
    })
  );
};
exports.$or = $or;
var $nor = function(params, scopePath, options) {
  var filter = $or(params, scopePath, options);
  return function(item, key, parent) {
    return !filter(item, key, parent);
  };
};
exports.$nor = $nor;
var $where = function(query) {
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
};
exports.$where = $where;
