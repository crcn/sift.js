/*
 * Sift 2.x
 *
 * Copryright 2015, Craig Condon
 * Licensed under MIT
 *
 * Filter JavaScript objects with mongodb queries
 */

(function() {

  "use strict";

  /**
   */

  function isFunction(value) {
    return typeof value === "function";
  }

  /**
   */

  function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
  }

  /**
   */

  function comparable(value) {
    if (value instanceof Date) {
      return value.getTime();
    } else if (value instanceof Array) {
      return value.map(comparable);
    } else {
      return value;
    }
  }

  /**
   */

  function and(a, b) {
    for (var i = 0, n = a.length; i < n; i++) if (!a[i](b)) return false;
    return true;
  }

  var validator = {

    /**
     */

    $eq: function(a) {

      var fn;

      if (a instanceof RegExp) {
        fn = function(b) {
          return a.test(comparable(b));
        };
      } else if (a instanceof Function) {
        fn = a;
      } else {
        fn = function(b) {
          if (b instanceof Array) {
            return ~comparable(b).indexOf(a);
          } else {
            return a === comparable(b);
          }
        };
      }

      return fn;
    },

    /**
     */

    $ne: function(a) {
      var $eq = validator.$eq(a);
      return function(b) {
        return !$eq(b);
      };
    },

    /**
     */

    $or: function(a) {
      var validators = a.map(parse);
      var n = validators.length;
      return function(b) {
        for (var i = 0; i < n; i++) if (validators[i](b)) return true;
        return false;
      };
    },

    /**
     */

    $gt: function(a) {
      return function(b) {
        return comparable(b) > a;
      };
    },

    /**
     */

    $gte: function(a) {
      return function(b) {
        return comparable(b) >= a;
      };
    },

    /**
     */

    $lt: function(a) {
      return function(b) {
        return comparable(b) < a;
      };
    },

    /**
     */

    $lte: function(a) {
      return function(b) {
        return comparable(b) <= a;
      };
    },

    /**
     */

    $mod: function(a) {
      return function(b) {
        return b % a[0] == a[1];
      };
    },

    /**
     */

    $in: function(a) {
      return function(b) {

        if (b instanceof Array) {
          for (var i = b.length; i--;) {
            if (~a.indexOf(comparable(b[i]))) return true;
          }
        } else {
          return !!~a.indexOf(comparable(b));
        }

        return false;
      };
    },

    /**
     */

    $nin: function(a) {
      var $in = validator.$in(a);
      return function(b) {
        return !$in(b);
      };
    },

    /**
     */

    $not: function(a) {
      var validate = parse(a);
      return function(b) {
        return !validate(b);
      };
    },

    /**
     */

    $type: function(a) {
       return function(b) {
         return b != void 0 ? b instanceof a || b.constructor == a : false;
       };
     },

    /**
     */

    $all: function(a) {
      return function(b) {
        if (!b) b = [];

        for (var i = a.length; i--;) {
          if (!~comparable(b).indexOf(a[i])) return false;
        }

        return true;
      };
    },

    /**
     */

    $size: function(a) {
      return function(b) {
        return b ? a === b.length : false;
      };
    },

    /**
     */

    $nor: function(a) {
      var validators = a.map(parse);
      var n = validators.length;
      return function(b) {
        for (var i = 0; i < n; i++) if (validators[i](b)) return false;
        return true;
      };
    },

    /**
     */

    $and: function(a) {
      var validators = a.map(parse);
      return function(b) {
        return and(validators, b);
      };
    },

    /**
     */

    $regex: function(a) {
      var aRE = new RegExp(a);
      return function(b) {
        return aRE.test(b);
      };
    },

    /**
     */

    $where: function(a) {
      var caller = typeof a === "string" ? new Function("obj", "return " + a) : a;
      return function(b) {
        return caller.call(b, b);
      };
    },

    /**
     */

    $elemMatch: function(a) {
      var validator = parse(a);
      return function(b) {
        if (isArray(b)) return !!~search(b, validator);
        return validator(b);
      };
    },

    /**
     */

    $exists: function(a) {
      a = !!a;
      return function(b) {
        return (b != void 0) === a;
      };
    }
  };

  /**
   */

  function search(array, validate) {

    for (var i = 0; i < array.length; i++) {
      if (validate(array[i])) {
        return i;
      }
    }

    return -1;
  }

  /**
   */

  function createNestedValidator(keypath, validate) {

    var keyPathParts = keypath.split(".");

    return function(b) {

      var values  = [];
      findValues(b, keyPathParts, 0, values);

      if (values.length === 1) return validate(values[0]);
      return !!~search(values, validate);
    };
  }

  /**
   */

  function findValues(current, keypath, index, values) {

    if (index === keypath.length || current == void 0) {
      values.push(current);
      return;
    }

    if (isArray(current)) {
      for (var i = 0, n = current.length; i < n; i++) {
        findValues(current[i], keypath, index, values);
      }
    } else {
      findValues(current[keypath[index]], keypath, index + 1, values);
    }
  }

  /**
   * flatten the query
   */

  function parse(query) {

    query = comparable(query);

    if (!query || (query.constructor.toString() !== "Object" &&
        query.constructor.toString() !== "function Object() { [native code] }")) {
      query = { $eq: query };
    }

    var validators = [];

    for (var key in query) {
      var a = query[key];

      if (validator[key]) {
        validators.push(validator[key](comparable(a)));
      } else {
        if (key.charCodeAt(0) === 36) {
          throw new Error("Unknown operation " + key);
        }
        validators.push(createNestedValidator(key, parse(a)));
      }
    }

    var n = validators.length;
    if (n === 1) return validators[0];

    return function(b) {
      return and(validators, b);
    };
  }

  /**
   */

  function sift(query, array, getter) {

    var validate = parse(query);

    if (isFunction(array)) {
      getter = array;
      array  = void 0;
    }

    if (getter) {
      validate = function(b) {
        return getter(b);
      };
    }

    if (array) {
      return array.filter(validate);
    }

    return validate;
  }

  /**
   */

  sift.use = function(plugin) {
    if (isFunction(plugin)) return plugin(sift);
    for (var key in plugin) {
      if (key.charCodeAt(0) === 36) validator[key] = plugin[key];
    }
  };

  /**
   */

  sift.indexOf = function(query, array, getter) {
    return search(array, sift(query, getter));
  };

  /* istanbul ignore next */
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = sift;
  } else if (typeof window !== "undefined") {
    window.sift = sift;
  }
})();
