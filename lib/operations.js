"use strict";
var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var core_1 = require("./core");
var filters_1 = require("./filters");
var $eq = function(params, options) {
  return filters_1.createEveryFilter(core_1.createTester(params, options));
};
exports.$eq = $eq;
var $ne = function(params, options) {
  var test = core_1.createTester(
    params,
    __assign(__assign({}, options), {
      compare: function(a, b) {
        if (utils_1.isArray(b) && !utils_1.isArray(a)) {
          return true;
        }
        return options.compare(a, b);
      }
    })
  );
  return filters_1.createEveryFilter(function(item) {
    return !test(item);
  });
};
exports.$ne = $ne;
var $gt = core_1.numericalTester(function(params) {
  return filters_1.createSomeFilter(function(item) {
    return utils_1.comparable(item) > params;
  });
});
exports.$gt = $gt;
var $gte = core_1.numericalTester(function(params) {
  return filters_1.createSomeFilter(function(item) {
    return utils_1.comparable(item) >= params;
  });
});
exports.$gte = $gte;
var $lt = core_1.numericalTester(function(params) {
  return filters_1.createSomeFilter(function(item) {
    return utils_1.comparable(item) < params;
  });
});
exports.$lt = $lt;
var $lte = core_1.numericalTester(function(params) {
  return filters_1.createSomeFilter(function(item) {
    return utils_1.comparable(item) <= params;
  });
});
exports.$lte = $lte;
var $mod = core_1.numericalTester(function(_a) {
  var mod = _a[0],
    equalsValue = _a[1];
  return filters_1.createSomeFilter(function(item) {
    return utils_1.comparable(item) % mod === equalsValue;
  });
});
exports.$mod = $mod;
var $exists = function(params) {
  return function(values) {
    return values.length > 0 === params;
  };
};
exports.$exists = $exists;
var $in = function(params, options) {
  var filter = $or(params, options);
  return function(item, key, parent) {
    return filter(item, key, parent);
  };
};
exports.$in = $in;
var $nin = function(params, options) {
  var filter = $in(params, options);
  return function(item, key, value) {
    return !filter(item, key, value);
  };
};
exports.$nin = $nin;
var $and = function(queries, options) {
  var testers = queries.map(function(query) {
    return core_1.createQueryTester(query, options);
  });
  return function(values) {
    return testers.every(function(test) {
      return values.some(test);
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
var $not = function(query, options) {
  var filter = core_1.createAndFilter(
    core_1.createQueryFilters2(query, options)
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
var $all = function(queries, options) {
  var filter = $and(queries, options);
  return function(item, key, parent) {
    return filter(item);
  };
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
var $regex = function(pattern, __options, _a) {
  var $options = _a.$options;
  var tester =
    pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
  return core_1.spreadValueArray(core_1.createRegexpFilter(tester));
};
exports.$regex = $regex;
var $elemMatch = function(query, options) {
  var test = core_1.createQueryTester(query, options);
  return function(values) {
    return values.every(test);
  };
};
exports.$elemMatch = $elemMatch;
var $or = function(queries, options) {
  var testers = queries.map(function(query) {
    return core_1.createQueryTester(query, options);
  });
  return function(values) {
    return values.some(function(value) {
      return testers.some(function(test) {
        return test(value);
      });
    });
  };
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
