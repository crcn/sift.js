/*
 * Sift 2.x
 *
 * Copryright 2015, Craig Condon
 * Licensed under MIT
 *
 * Filter JavaScript objects with mongodb queries
 */

(function() {

  /**
   */

  function createGetter(keypath) {
    return new Function("target", "try { return target." + keypath + " } catch(e) { }");
  }

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

  function isPrimitive(value) {
    return typeof value !== "object" || value == void 0;
  }

  /**
   */

  var handle = {

    /**
     */

    $eq: function(a, b) {
      return a.test(b);
    },

    /**
     */

    $neq: function(a, b) {
      return !a.test(b);
    },

    /**
     */

    $or: function(a, b) {

      var i = a.length;
      var n = i;

      for (; i--;) {
        if (test(a[i], b)) {
          return true;
        }
      }

      return n === 0;
    }
  };

  var validator = {

    /**
     */

    $eq: function(a) {
      var fn;

      if (a instanceof RegExp) {
        fn = function(b) {
          return a.test(b);
        };
      } else if (a instanceof Function) {
        fn = a;
      } else {
        fn = function(b) {
          if (b instanceof Array) {
            return ~b.indexOf(a);
          } else {
            return a === b;
          }
        };
      }

      return fn;
    },

    /**
     */

    $neq: function(a) {
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
        return b > a;
      };
    }
  };

  /**
   */

  function createNestedValidator(keypath, validator) {
    var getValue = createGetter(keypath);
    return function(b) {
      return validator(getValue(b));
    };
  }

  /**
   * flatten the query
   */

  function parse(query) {

    if (isPrimitive(query)) {
      query = { $eq: query };
    }

    var validators = [];

    for (var key in query) {
      var a = query[key];

      if (validator[key]) {
        validators.push(validator[key](a));
      } else {
        validators.push(createNestedValidator(key, parse(a)));
      }
    }

    var n = validators.length;
    if (n === 1) return validators[0];

    return function(b) {
      for (var i = 0; i < n; i++) if (!validators[i](b)) return false;
      return true;
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

  sift.use = function() {

  };

  /**
   */

  sift.indexOf = function(query, array, getter) {

    var validate = sift(query, getter);

    for (var i = 0; i < array.length; i++) {
      if (validate(array[i])) {
        return i;
      }
    }

    return -1;
  };

  /* istanbul ignore next */
  if (typeof module !== "undefined" && typeof module.exports != "undefined") {
    module.exports = sift;
  } else if (typeof window != "undefined") {
    window.sift = sift;
  }
})();
