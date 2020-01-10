"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var core_1 = require("./core");
var $eq = function(params, options) {
  return core_1.spreadValueArray(core_1.createFilter(params, options));
};
exports.$eq = $eq;
var $ne = function(params, options) {
  var filter = $eq(params, options);
  return function(item, key, parent) {
    return !filter(item, key, parent);
  };
};
exports.$ne = $ne;
var $gt = core_1.numericalTester(function(params) {
  return function(item) {
    return utils_1.comparable(item) > params;
  };
});
exports.$gt = $gt;
var $gte = core_1.numericalTester(function(params) {
  return function(item) {
    return utils_1.comparable(item) >= params;
  };
});
exports.$gte = $gte;
var $lt = core_1.numericalTester(function(params) {
  return function(item) {
    return utils_1.comparable(item) < params;
  };
});
exports.$lt = $lt;
var $lte = core_1.numericalTester(function(params) {
  return function(item) {
    return utils_1.comparable(item) <= params;
  };
});
exports.$lte = $lte;
var $mod = core_1.numericalTester(function(_a) {
  var mod = _a[0],
    equalsValue = _a[1];
  return function(item) {
    return utils_1.comparable(item) % mod === equalsValue;
  };
});
exports.$mod = $mod;
var $exists = function(params) {
  return core_1.spreadValueArray(function(item, key, parent) {
    return parent.hasOwnProperty(key) === params;
  });
};
exports.$exists = $exists;
var $in = function(params, options) {
  var filter = $or(params, options);
  return function(item, key, parent) {
    return filter(item, key, parent);
  };
};
var $nin = function(params, options) {
  var filter = $in(params, options);
  return function(item, key, value) {
    return !filter(item, key, value);
  };
};
exports.$nin = $nin;
var $and = function(params, options) {
  var filter = core_1.createAndFilter(
    params.map(function(query) {
      return core_1.createOrFilter(core_1.createQueryFilters(query, options));
    })
  );
  return filter;
};
var $options = function(params) {
  return function(item) {
    return true;
  };
};
exports.$options = $options;
var $not = function(query, options) {
  var filter = core_1.createAndFilter(
    core_1.createQueryFilters(query, options)
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
var $all = function(query, options) {
  return $and(query, options);
};
exports.$all = $all;
var $type = function(clazz) {
  return core_1.spreadValueArray(function(item) {
    return item == undefined
      ? false
      : item instanceof clazz || item.constructor === clazz;
  });
};
exports.$type = $type;
var $regex = function(pattern, options, _a) {
  var $options = _a.$options;
  var tester =
    pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
  return core_1.spreadValueArray(core_1.createRegexpFilter(tester));
};
exports.$regex = $regex;
var $elemMatch = function(query, options) {
  var filter = core_1.createAndFilter(
    core_1.createQueryFilters(query, options)
  );
  return filter;
};
exports.$elemMatch = $elemMatch;
var $or = function(params, options) {
  return core_1.createOrFilter(
    params.map(function(query) {
      return core_1.createAndFilter(core_1.createQueryFilters(query, options));
    })
  );
};
exports.$or = $or;
var $nor = function(params, options) {
  var filter = $or(params, options);
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
