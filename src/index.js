/*
 *
 * Copryright 2018, Craig Condon
 * Licensed under MIT
 *
 * Filter JavaScript objects with mongodb queries
 */

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

function get(obj, key) {
  return isFunction(obj.get) ? obj.get(key) : obj[key];
}

/**
 */

function or(validator) {
  return function(a, b) {
    if (!isArray(b) || !b.length) {
      return validator(a, b);
    }
    for (var i = 0, n = b.length; i < n; i++) {
      if (validator(a, get(b, i))) return true;
    }
    return false;
  };
}

/**
 */

function and(validator) {
  return function(a, b) {
    if (!isArray(b) || !b.length) {
      return validator(a, b);
    }
    for (var i = 0, n = b.length; i < n; i++) {
      if (!validator(a, get(b, i))) return false;
    }
    return true;
  };
}

function validate(validator, b, k, o) {
  return validator.v(validator.a, b, k, o);
}

var defaultExpressions = {
  /**
   */

  $eq: or(function(a, b) {
    return a(b);
  }),

  /**
   */

  $ne: and(function(a, b) {
    return a(b);
  }),

  /**
   */

  $gt: or(function(a, b) {
    return a(b);
  }),

  /**
   */

  $gte: or(function(a, b) {
    return a(b);
  }),

  /**
   */

  $lt: or(function(a, b) {
    return a(b);
  }),

  /**
   */

  $lte: or(function(a, b) {
    return a(b);
  }),

  /**
   */

  $mod: or(function(a, b) {
    return a(b);
  }),

  /**
   */

  $in: function(a, b) {
    return a(b);
  },

  /**
   */

  $nin: function(a, b) {
    return a(b);
  },

  /**
   */

  $not: function(a, b, k, o) {
    return a(b, k, o);
  },

  /**
   */

  $type: function(a, b) {
    return a(b);
  },

  /**
   */

  $all: function(a, b, k, o) {
    return defaultExpressions.$and(a, b, k, o);
  },

  /**
   */

  $size: function(a, b) {
    return b ? a === b.length : false;
  },

  /**
   */

  $or: function(a, b, k, o) {
    for (var i = 0, n = a.length; i < n; i++) {
      if (validate(get(a, i), b, k, o)) {
        return true;
      }
    }
    return false;
  },

  /**
   */

  $nor: function(a, b, k, o) {
    return !defaultExpressions.$or(a, b, k, o);
  },

  /**
   */

  $and: function(a, b, k, o) {
    for (var i = 0, n = a.length; i < n; i++) {
      if (!validate(get(a, i), b, k, o)) {
        return false;
      }
    }
    return true;
  },

  /**
   */

  $regex: or(function(a, b) {
    return typeof b === "string" && a.test(b);
  }),

  /**
   */

  $where: function(a, b, k, o) {
    return a.call(b, b, k, o);
  },

  /**
   */

  $elemMatch: function(a, b, k, o) {
    if (isArray(b)) {
      return !!~search(b, a);
    }
    return validate(a, b, k, o);
  },

  /**
   */

  $exists: function(a, b, k, o) {
    return o.hasOwnProperty(k) === a;
  }
};

/**
 */

var prepare = {
  /**
   */

  $eq: function(a, query, { comparable, compare }) {
    if (a instanceof RegExp) {
      return or(function(b) {
        return typeof b === "string" && a.test(b);
      });
    } else if (a instanceof Function) {
      return or(a);
    } else if (isArray(a) && !a.length) {
      // Special case of a == []
      return or(function(b) {
        return isArray(b) && !b.length;
      });
    } else if (a === null) {
      return or(function(b) {
        //will match both null and undefined
        return b == null;
      });
    }
    return or(function(b) {
      return compare(comparable(b), comparable(a)) === 0;
    });
  },

  $gt: function(a, query, { comparable, compare }) {
    return function(b) {
      return compare(comparable(b), comparable(a)) > 0;
    };
  },

  $gte: function(a, query, { comparable, compare }) {
    return function(b) {
      return compare(comparable(b), comparable(a)) >= 0;
    };
  },

  $lt: function(a, query, { comparable, compare }) {
    return function(b) {
      return compare(comparable(b), comparable(a)) < 0;
    };
  },
  $lte: function(a, query, { comparable, compare }) {
    return function(b) {
      return compare(comparable(b), comparable(a)) <= 0;
    };
  },

  $in: function(a, query, options) {
    const { comparable } = options;
    return function(b) {
      if (b instanceof Array) {
        for (var i = b.length; i--; ) {
          if (~a.indexOf(comparable(get(b, i)))) {
            return true;
          }
        }
      } else {
        var comparableB = comparable(b);
        if (comparableB === b && typeof b === "object") {
          for (var i = a.length; i--; ) {
            if (String(a[i]) === String(b) && String(b) !== "[object Object]") {
              return true;
            }
          }
        }

        /*
          Handles documents that are undefined, whilst also
          having a 'null' element in the parameters to $in.
        */
        if (typeof comparableB == "undefined") {
          for (var i = a.length; i--; ) {
            if (a[i] == null) {
              return true;
            }
          }
        }

        /*
          Handles the case of {'field': {$in: [/regexp1/, /regexp2/, ...]}}
        */
        for (var i = a.length; i--; ) {
          var validator = createRootValidator(get(a, i), options);
          var result = validate(validator, b, i, a);
          if (
            result &&
            String(result) !== "[object Object]" &&
            String(b) !== "[object Object]"
          ) {
            return true;
          }
        }

        return !!~a.indexOf(comparableB);
      }

      return false;
    };
  },

  $nin: function(a, query, options) {
    const eq = prepare.$in(a, query, options);
    return function(a, b, k, o) {
      return !eq(a, b, k, o);
    };
  },

  $mod: function(a) {
    return function(b) {
      return b % a[0] == a[1];
    };
  },

  /**
   */

  $ne: function(a, query, options) {
    const eq = prepare.$eq(a, query, options);
    return and(function(a, b, k, o) {
      return !eq(a, b, k, o);
    });
  },

  /**
   */

  $and: function(a, query, options) {
    return a.map(parse(options));
  },

  /**
   */

  $all: function(a, query, options) {
    return prepare.$and(a, query, options);
  },

  /**
   */

  $or: function(a, query, options) {
    return a.map(parse(options));
  },

  /**
   */

  $nor: function(a, query, options) {
    return a.map(parse(options));
  },

  /**
   */

  $not: function(a, query, options) {
    const v = parse(options)(a);
    return function(b, k, o) {
      return !validate(v, b, k, o);
    };
  },

  $type: function(a) {
    return function(b, k, o) {
      return b != void 0 ? b instanceof a || b.constructor == a : false;
    };
  },

  /**
   */

  $regex: function(a, query) {
    return new RegExp(a, query.$options);
  },

  /**
   */

  $where: function(a) {
    return typeof a === "string" ? new Function("obj", "return " + a) : a;
  },

  /**
   */

  $elemMatch: function(a, query, options) {
    return parse(options)(a);
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
    var result = get(array, i);
    if (validate(validator, get(array, i))) {
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
  var values = [];
  findValues(b, a.k, 0, b, values);

  if (values.length === 1) {
    var first = values[0];
    return validate(a.nv, first[0], first[1], first[2]);
  }

  // If the query contains $ne, need to test all elements ANDed together
  var inclusive = a && a.q && typeof a.q.$ne !== "undefined";
  var allValid = inclusive;
  for (var i = 0; i < values.length; i++) {
    var result = values[i];
    var isValid = validate(a.nv, result[0], result[1], result[2]);
    if (inclusive) {
      allValid &= isValid;
    } else {
      allValid |= isValid;
    }
  }
  return allValid;
}

/**
 */

function findValues(current, keypath, index, object, values) {
  if (index === keypath.length || current == void 0) {
    values.push([current, keypath[index - 1], object]);
    return;
  }

  var k = get(keypath, index);

  // ensure that if current is an array, that the current key
  // is NOT an array index. This sort of thing needs to work:
  // sift({'foo.0':42}, [{foo: [42]}]);
  if (isArray(current) && isNaN(Number(k))) {
    for (var i = 0, n = current.length; i < n; i++) {
      findValues(get(current, i), keypath, index, current, values);
    }
  } else {
    findValues(get(current, k), keypath, index + 1, current, values);
  }
}

/**
 */

function createNestedValidator(keypath, a, q) {
  return { a: { k: keypath, nv: a, q: q }, v: nestedValidator };
}

/**
 * flatten the query
 */

function isVanillaObject(value) {
  return (
    value &&
    (value.constructor === Object ||
      value.constructor === Array ||
      value.constructor.toString() === "function Object() { [native code] }" ||
      value.constructor.toString() === "function Array() { [native code] }")
  );
}

function parse(options) {
  const { comparable, expressions } = options;
  var wrapQuery = function(query) {
    if (!query || !isVanillaObject(query)) {
      query = { $eq: query };
    }
    return query;
  };

  var parseQuery = function(query) {
    query = comparable(query);

    var validators = [];

    for (var key in query) {
      var a = query[key];

      if (key === "$options") {
        continue;
      }

      var expression =
        defaultExpressions[key] || (options && expressions && expressions[key]);

      if (expression) {
        if (prepare[key]) {
          a = prepare[key](a, query, options);
        }
        validators.push(createValidator(comparable(a), expression));
      } else {
        if (key.charCodeAt(0) === 36) {
          throw new Error("Unknown operation " + key);
        }

        var keyParts = key.split(".");

        validators.push(createNestedValidator(keyParts, parseNested(a), a));
      }
    }

    return validators.length === 1
      ? validators[0]
      : createValidator(validators, defaultExpressions.$and);
  };

  var parseNested = function(query) {
    query = wrapQuery(query);
    if (isExactObject(query)) {
      return createValidator(query, isEqual);
    }
    return parseQuery(query);
  };

  var parseRoot = function(query) {
    return parseQuery(wrapQuery(query));
  };

  return parseRoot;
}

function isEqual(a, b) {
  if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
    return false;
  }

  if (isObject(a)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      return false;
    }

    for (var key in a) {
      if (!isEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  } else if (isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0, n = a.length; i < n; i++) {
      if (!isEqual(a[i], b[i])) {
        return false;
      }
    }

    return true;
  } else {
    return a === b;
  }
}

function getAllKeys(value, keys) {
  if (!isObject(value)) {
    return keys;
  }
  for (var key in value) {
    keys.push(key);
    getAllKeys(value[key], keys);
  }
  return keys;
}

function isExactObject(value) {
  const allKeysHash = getAllKeys(value, []).join(",");
  return allKeysHash.search(/[$.]/) === -1;
}

/**
 */

function createRootValidator(query, options) {
  var validator = parse(options)(query);
  if (options && options.select) {
    validator = {
      a: validator,
      v: function(a, b, k, o) {
        return validate(a, b && options.select(b), k, o);
      }
    };
  }
  return validator;
}

/**
 */

export default function sift(query, options) {
  options = Object.assign({ compare, comparable }, options);
  var validator = createRootValidator(query, options);
  return function(b, k, o) {
    return validate(validator, b, k, o);
  };
}

/**
 */

export function compare(a, b) {
  if (isEqual(a, b)) return 0;
  if (typeof a === typeof b) {
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
  }
}

/**
 */

export function comparable(value) {
  if (value instanceof Date) {
    return value.getTime();
  } else if (isArray(value)) {
    return value.map(comparable);
  } else if (value && typeof value.toJSON === "function") {
    return value.toJSON();
  } else {
    return value;
  }
}
