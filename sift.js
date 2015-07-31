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

  function or(validator) {
    return function(a, b) {
      if (!isArray(b)) return validator(a, b);
      for (var i = 0, n = b.length; i < n; i++) if (validator(a, b[i])) return true;
      return false;
    }
  }

  /**
   */

  function and(validator) {
    return function(a, b) {
      if (!isArray(b)) return validator(a, b);
      for (var i = 0, n = b.length; i < n; i++) if (!validator(a, b[i])) return false;
      return true;
    };
  }

  function validate(validator, b) {
    return validator.v(validator.a, b);
  }


  var operator = {

    /**
     */

    $eq: or(function(a, b) {
      return a(b);
    }),

    /**
     */

    $ne: and(function(a, b) {
      return !a(b);
    }),

    /**
     */

    $or: function(a, b) {
      for (var i = 0, n = a.length; i < n; i++) if (validate(a[i], b)) return true;
      return false;
    },

    /**
     */

    $gt: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) > a;
    }),

    /**
     */

    $gte: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) >= a;
    }),

    /**
     */

    $lt: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) < a;
    }),

    /**
     */

    $lte: or(function(a, b) {
      return typeof comparable(b) === typeof a && comparable(b) <= a;
    }),

    /**
     */

    $mod: or(function(a, b) {
      return b % a[0] == a[1];
    }),

    /**
     */

    $in: function(a, b) {

      if (b instanceof Array) {
        for (var i = b.length; i--;) {
          if (~a.indexOf(comparable(b[i]))) return true;
        }
      } else {
        return !!~a.indexOf(comparable(b));
      }

      return false;
    },

    /**
     */

    $nin: function(a, b) {
      return !operator.$in(a, b);
    },

    /**
     */

    $not: function(a, b) {
      return !validate(a, b);
    },

    /**
     */

    $type: function(a, b) {
      return b != void 0 ? b instanceof a || b.constructor == a : false;
     },

    /**
     */

    $all: function(a, b) {
      if (!b) b = [];
      for (var i = a.length; i--;) {
        if (!~comparable(b).indexOf(a[i])) return false;
      }
      return true;
    },

    /**
     */

    $size: function(a, b) {
      return b ? a === b.length : false;
    },

    /**
     */

    $nor: function(a, b) {
      // todo - this suffice? return !operator.$in(a)
      for (var i = 0, n = a.length; i < n; i++) if (validate(a[i], b)) return false;
      return true;
    },

    /**
     */

    $and: function(a, b) {
      for (var i = 0, n = a.length; i < n; i++) if (!validate(a[i], b)) return false;
      return true;
    },

    /**
     */

    $regex: function(a, b) {
      return a.test(b);
    },

    /**
     */

    $where: function(a, b) {
      return a.call(b, b);
    },

    /**
     */

    $elemMatch: function(a, b) {
      if (isArray(b)) return !!~search(b, a);
      return validate(a, b);
    },

    /**
     */

    $exists: function(a, b) {
      return (b != void 0) === a;
    }
  };

  /**
   */

  var prepare = {

    /**
     */

    $eq: function(a) {

      if (a instanceof RegExp) {
        return function(b) {
          return a.test(comparable(b));
        };
      } else if (a instanceof Function) {
        return a;
      }

      return function(b) {
        return a === comparable(b);
      };
    },

    /**
     */

    $ne: function(a) {
      return prepare.$eq(a);
    },

    /**
     */

    $and: function(a) {
      return a.map(parse);
    },

    /**
     */

    $or: function(a) {
      return a.map(parse);
    },

    /**
     */

    $nor: function(a) {
      return a.map(parse);
    },

    /**
     */

    $not: function(a) {
      return parse(a);
    },

    /**
     */

    $regex: function(a) {
      return new RegExp(a);
    },

    /**
     */

    $where: function(a) {
      return typeof a === "string" ? new Function("obj", "return " + a) : a;
    },

    /**
     */

    $elemMatch: function(a) {
      return parse(a);
    },

    /**
     */

    $exists: function(a) {
      return !!a;
    }
  };

  /**
   */

  function search(array, validator) {

    for (var i = 0; i < array.length; i++) {
      if (validate(validator, array[i])) {
        return i;
      }
    }

    return -1;
  }

  /**
   */

  function createValidator(a, validate) {
    return { a: a, v: validate };
  }

  /**
   */

  function nestedValidator(a, b) {
    var values  = [];
    findValues(b, a.k, 0, values);

    if (values.length === 1) {
      return validate(a.nv, values[0]);
    }

    return !!~search(values, a.nv);
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
   */

  function createNestedValidator(keypath, a) {
    return { a: { k: keypath, nv: a }, v: nestedValidator };
  }

  /**
   * flatten the query
   */

  function parse(query) {

    query = comparable(query);

    if (!query || (query.constructor.toString() !== "Object" &&
        query.constructor.toString().replace(/\n/g,'').replace(/ /g, '') !== "functionObject(){[nativecode]}")) { // cross browser support
      query = { $eq: query };
    }

    var validators = [];

    for (var key in query) {
      var a = query[key];


      if (operator[key]) {
        if (prepare[key]) a = prepare[key](a);
        validators.push(createValidator(comparable(a), operator[key]));
      } else {
        if (key.charCodeAt(0) === 36) {
          throw new Error("Unknown operation " + key);
        }
        validators.push(createNestedValidator(key.split("."), parse(a)));
      }
    }

    return validators.length === 1 ? validators[0] : createValidator(validators, operator.$and);
  }

  /**
   */

  function createRootValidator(query, getter) {
    var validator = parse(query);
    if (getter) {
      validator = {
        a: validator,
        v: function(a, b) {
          return validate(a, getter(b));
        }
      };
    }
    return validator;
  }

  /**
   */

  function sift(query, array, getter) {

    if (isFunction(array)) {
      getter = array;
      array  = void 0;
    }

    var validator = createRootValidator(query, getter);

    function filter(b) {
      return validate(validator, b);
    }

    if (array) {
      return array.filter(filter);
    }

    return filter;
  }

  /**
   */

  sift.use = function(plugin) {
    if (isFunction(plugin)) return plugin(sift);
    for (var key in plugin) {
      if (key.charCodeAt(0) === 36) operator[key] = plugin[key];
    }
  };

  /**
   */

  sift.indexOf = function(query, array, getter) {
    return search(array, createRootValidator(query, getter));
  };

  /* istanbul ignore next */
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = sift;
  } else if (typeof window !== "undefined") {
    window.sift = sift;
  }
})();
