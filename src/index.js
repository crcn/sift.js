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
  return function(validateOptions, value) {
    if (!isArray(value) || !value.length) {
      return validator(validateOptions, value);
    }
    for (var i = 0, n = value.length; i < n; i++) {
      if (validator(validateOptions, get(value, i))) return true;
    }
    return false;
  };
}

/**
 */

function and(validator) {
  return function(validateOptions, value) {
    if (!isArray(value) || !value.length) {
      return validator(validateOptions, value);
    }
    for (var i = 0, n = value.length; i < n; i++) {
      if (!validator(validateOptions, get(value, i))) return false;
    }
    return true;
  };
}

function validate(validator, value, key, valueOwner) {
  return validator.validate(validator.options, value, key, valueOwner);
}

var defaultExpressions = {
  /**
   */

  $eq: or(function(test, value) {
    return test(value);
  }),

  /**
   */

  $ne: and(function(test, value) {
    return test(value);
  }),

  /**
   */

  $gt: or(function(test, value) {
    return test(value);
  }),

  /**
   */

  $gte: or(function(test, value) {
    return test(value);
  }),

  /**
   */

  $lt: or(function(test, value) {
    return test(value);
  }),

  /**
   */

  $lte: or(function(test, value) {
    return test(value);
  }),

  /**
   */

  $mod: or(function(test, value) {
    return test(value);
  }),

  /**
   */

  $in(test, value) {
    return test(value);
  },

  /**
   */

  $nin: function(test, value) {
    return test(value);
  },

  /**
   */

  $not: function(test, value, key, valueOwner) {
    return test(value, key, valueOwner);
  },

  /**
   */

  $type: function(testType, value) {
    return testType(value);
  },

  /**
   */

  $all: function(allOptions, value, key, valueOwner) {
    return defaultExpressions.$and(allOptions, value, key, valueOwner);
  },

  /**
   */

  $size: function(sizeMatch, value) {
    return value ? sizeMatch === value.length : false;
  },

  /**
   */

  $or: function(orOptions, value, key, valueOwner) {
    for (var i = 0, n = orOptions.length; i < n; i++) {
      if (validate(get(orOptions, i), value, key, valueOwner)) {
        return true;
      }
    }
    return false;
  },

  /**
   */

  $nor: function(validateOptions, value, key, valueOwner) {
    return !defaultExpressions.$or(validateOptions, value, key, valueOwner);
  },

  /**
   */

  $and: function(validateOptions, value, key, valueOwner) {
    for (var i = 0, n = validateOptions.length; i < n; i++) {
      if (!validate(get(validateOptions, i), value, key, valueOwner)) {
        return false;
      }
    }
    return true;
  },

  /**
   */

  $regex: or(function(validateOptions, value) {
    return typeof value === "string" && validateOptions.test(value);
  }),

  /**
   */

  $where: function(validateOptions, value, key, valueOwner) {
    return validateOptions.call(value, value, key, valueOwner);
  },

  /**
   */

  $elemMatch: function(validateOptions, value, key, valueOwner) {
    if (isArray(value)) {
      return !!~search(value, validateOptions);
    }
    return validate(validateOptions, value, key, valueOwner);
  },

  /**
   */

  $exists: function(validateOptions, value, key, valueOwner) {
    return valueOwner.hasOwnProperty(key) === validateOptions;
  }
};

/**
 */

var prepare = {
  /**
   */

  $eq: function(query, queryOwner, { comparable, compare }) {
    if (query instanceof RegExp) {
      return or(function(value) {
        return typeof value === "string" && query.test(value);
      });
    } else if (query instanceof Function) {
      return or(query);
    } else if (isArray(query) && !query.length) {
      // Special case of a == []
      return or(function(value) {
        return isArray(value) && !value.length;
      });
    } else if (query === null) {
      return or(function(value) {
        //will match both null and undefined
        return value == null;
      });
    }

    return or(function(value) {
      return compare(comparable(value), comparable(query)) === 0;
    });
  },

  $gt: function(query, queryOwner, { comparable, compare }) {
    return function(value) {
      return compare(comparable(value), comparable(query)) > 0;
    };
  },

  $gte: function(query, queryOwner, { comparable, compare }) {
    return function(value) {
      return compare(comparable(value), comparable(query)) >= 0;
    };
  },

  $lt: function(query, queryOwner, { comparable, compare }) {
    return function(value) {
      return compare(comparable(value), comparable(query)) < 0;
    };
  },
  $lte: function(query, queryOwner, { comparable, compare }) {
    return function(value) {
      return compare(comparable(value), comparable(query)) <= 0;
    };
  },

  $in: function(query, queryOwner, options) {
    const { comparable } = options;
    return function(value) {
      if (value instanceof Array) {
        for (var i = value.length; i--; ) {
          if (~query.indexOf(comparable(get(value, i)))) {
            return true;
          }
        }
      } else {
        var comparableValue = comparable(value);
        if (comparableValue === value && typeof value === "object") {
          for (var i = query.length; i--; ) {
            if (
              String(query[i]) === String(value) &&
              String(value) !== "[object Object]"
            ) {
              return true;
            }
          }
        }

        /*
          Handles documents that are undefined, whilst also
          having a 'null' element in the parameters to $in.
        */
        if (typeof comparableValue == "undefined") {
          for (var i = query.length; i--; ) {
            if (query[i] == null) {
              return true;
            }
          }
        }

        /*
          Handles the case of {'field': {$in: [/regexp1/, /regexp2/, ...]}}
        */
        for (var i = query.length; i--; ) {
          var validator = createRootValidator(get(query, i), options);
          var result = validate(validator, comparableValue, i, query);
          if (
            result &&
            String(result) !== "[object Object]" &&
            String(comparableValue) !== "[object Object]"
          ) {
            return true;
          }
        }

        return !!~query.indexOf(comparableValue);
      }

      return false;
    };
  },

  $nin: function(query, queryOwner, options) {
    const eq = prepare.$in(query, queryOwner, options);
    return function(validateOptions, value, key, valueOwner) {
      return !eq(validateOptions, value, key, valueOwner);
    };
  },

  $mod: function(query) {
    return function(value) {
      return value % query[0] == query[1];
    };
  },

  /**
   */

  $ne: function(query, queryOwner, options) {
    const eq = prepare.$eq(query, queryOwner, options);
    return and(function(validateOptions, value, key, valueOwner) {
      return !eq(validateOptions, value, key, valueOwner);
    });
  },

  /**
   */

  $and: function(query, queryOwner, options) {
    return query.map(parse(options));
  },

  /**
   */

  $all: function(query, queryOwner, options) {
    return prepare.$and(query, queryOwner, options);
  },

  /**
   */

  $or: function(query, queryOwner, options) {
    return query.map(parse(options));
  },

  /**
   */

  $nor: function(query, queryOwner, options) {
    return query.map(parse(options));
  },

  /**
   */

  $not: function(query, queryOwner, options) {
    const validateOptions = parse(options)(query);
    return function(value, key, valueOwner) {
      return !validate(validateOptions, value, key, valueOwner);
    };
  },

  $type: function(query) {
    return function(value, key, valueOwner) {
      return value != void 0
        ? value instanceof query || value.constructor == query
        : false;
    };
  },

  /**
   */

  $regex: function(query, queryOwner) {
    return new RegExp(query, queryOwner.$options);
  },

  /**
   */

  $where(query) {
    if (typeof query === "function") {
      return query;
    }

    if (!process.env.CSP_ENABLED) {
      return new Function("obj", "return " + query);
    }

    throw new Error(
      'In CSP mode, sift does not support strings in "$where" condition'
    );
  },

  /**
   */

  $elemMatch: function(query, queryOwner, options) {
    return parse(options)(query);
  },

  /**
   */

  $exists: function(query) {
    return !!query;
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

function createValidator(options, validate) {
  return { options, validate };
}

/**
 */

function validatedNested({ keyPath, child, query }, value) {
  var values = [];
  findValues(value, keyPath, 0, value, values);

  if (values.length === 1) {
    var first = values[0];
    return validate(child, first[0], first[1], first[2]);
  }

  // If the query contains $ne, need to test all elements ANDed together
  var inclusive = query && typeof query.$ne !== "undefined";
  var allValid = inclusive;
  for (var i = 0; i < values.length; i++) {
    var result = values[i];
    var isValid = validate(child, result[0], result[1], result[2]);
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

function createNestedValidator(keyPath, child, query) {
  return createValidator({ keyPath, child, query }, validatedNested);
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
      value.constructor.toString() === "function Array() { [native code] }") &&
    !value.toJSON
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
      var queryValue = query[key];

      if (key === "$options") {
        continue;
      }

      var expression =
        defaultExpressions[key] || (options && expressions && expressions[key]);

      if (expression) {
        if (prepare[key]) {
          queryValue = prepare[key](queryValue, query, options);
        }
        validators.push(createValidator(comparable(queryValue), expression));
      } else {
        if (key.charCodeAt(0) === 36) {
          throw new Error("Unknown operation " + key);
        }

        var keyParts = key.split(".");

        validators.push(
          createNestedValidator(keyParts, parseNested(queryValue), queryValue)
        );
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
      options: validator,
      validate: function(validateOptions, value, key, valueOwner) {
        return validate(
          validateOptions,
          value && options.select(value),
          key,
          valueOwner
        );
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
  return function(value, key, valueOwner) {
    return validate(validator, value, key, valueOwner);
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
