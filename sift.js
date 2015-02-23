/*
 * Sift
 *
 * Copryright 2011, Craig Condon
 * Licensed under MIT
 *
 * Inspired by mongodb's query language
 */

(function() {

  "use strict";

  //traversable statements
  var TRAV_OP = {
    $and  : true,
    $or   : true,
    $nor  : true,
    $trav : true,
    $not  : true
  };

  var _testers = {

    /**
     */

    $eq: function(a, b) {
      return a.test(b);
    },

    /**
     */

    $ne: function(a, b) {
      return !a.test(b);
    },

    /**
     */

    $lt: function(a, b) {
      return a > b;
    },

    /**
     */

    $gt: function(a, b) {
      return a < b;
    },

    /**
     */

    $lte: function(a, b) {
      return a >= b;
    },

    /**
     */

    $gte: function(a, b) {
      return a <= b;
    },

    /**
     */

    $exists: function(a, b) {
      return a === (b != null);
    },

    /**
     */

    $in: function(a, b) {

      //intersecting an array
      if (b instanceof Array) {

        for (var i = b.length; i--;) {
          if (~a.indexOf(b[i])) return true;
        }

      } else {
        return ~a.indexOf(b);
      }

      return false;
    },

    /**
     */

    $not: function(a, b) {
      if (!a.test) throw new Error("$not test should include an expression, not a value. Use $ne instead.");
      return !a.test(b);
    },

    /**
     */

    $type: function(a, b, org) {
      //instanceof doesn't work for strings / boolean. instanceof works with inheritance
      return org != null ? org instanceof a || org.constructor == a : false;
    },

    /**
     */

    $nin: function(a, b) {
      return !_testers.$in(a, b);
    },

    /**
     */

    $mod: function(a, b) {
      return b % a[0] == a[1];
    },

    /**
     */

    $all: function(a, b) {
      if (!b) b = [];
      for (var i = a.length; i--;) {
        var a1 = a[i];
        var indexInB = ~b.indexOf(a1);
        if (!indexInB) return false;
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

    $or: function(a, b) {

      var i = a.length;
      var n = i;

      for (; i--;) {
        if (test(a[i], b)) {
          return true;
        }
      }

      return n === 0;
    },

    /**
     */

    $nor: function(a, b) {

      var i = a.length;

      for (; i--;) {
        if (test(a[i], b)) {
          return false;
        }
      }

      return true;
    },

    /**
     */

    $and: function(a, b) {

      for (var i = a.length; i--;) {
        if (!test(a[i], b)) {
          return false;
        }
      }

      return true;
    },

    /**
     */

    $trav: function(a, b) {

      if (b instanceof Array) {

        for (var i = b.length; i--;) {
          var subb = b[i];
          if (subb[a.k] && test(a, subb[a.k])) return true;
        }

        return false;
      }

      //continue to traverse even if there isn't a value - this is needed for
      //something like name:{$exists:false}
      return test(a, b ? b[a.k] : void 0);
    },

    /**
     */

    $regex: function(a, b) {
      var aRE = new RegExp(a);
      return aRE.test(b);
    },

    /**
     */

    $where: function(a, b) {
      return a.call(b, b);
    },

    /**
     */

    $elemMatch: function(a, b) {
      return a.test(b);
    }
  };

  var _prepare = {

    /**
     */

    $eq: function(a) {

      var fn;

      if (a instanceof RegExp) {
        return a;
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

      return {
        test: fn
      };
    },

    /**
     */

    $ne: function(a) {
      return _prepare.$eq(a);
    },

     /**
      */

    $where: function(a) {

      if (typeof a === "string") {
        return new Function("obj", "return " + a);
      }

      return a;
    },

    /**
     */

    $elemMatch: function(a) {
      return parse(a);
    }
  };

  /**
   */

  function getExpr(type, key, value) {

    var v = comparable(value);

    return {

      //k key
      k: key,

      //v value
      v: _prepare[type] ? _prepare[type](v) : v,

      //e eval
      e: _testers[type]
    };
  }

  /**
   * tests against data
   */

  function test(statement, data) {

    var exprs    = statement.exprs;

    //generally, expressions are ordered from least efficient, to most efficient.
    for (var i = 0, n = exprs.length; i < n; i++) {

      var expr = exprs[i];

      if (!expr.e(expr.v, comparable(data), data)) return false;

    }

    return true;
  }

  /**
   * parses a statement into something evaluable
   */

  function parse(statement, key) {

    //fixes sift(null, []) issue
    if (!statement) statement = { $eq: statement };

    var testers = [];

    //if the statement is an object, then we're looking at something like: { key: match }
    if (statement && statement.constructor === Object) {

      for (var k in statement) {

        //find the apropriate operator. If one doesn't exist and the key does not start
        //with a $ character, then it's a property, which means we create a new statement
        //(traversing)
        var operator;
        if (!!_testers[k]) {
          operator = k;

        // $ == 36
        } else if (k.charCodeAt(0) !== 36) {
          operator = "$trav";
        } else {
          throw new Error("Unknown operator " + k + ".");
        }

        //value of given statement (the match)
        var value = statement[k];

        //default = match
        var exprValue = value;

        //if we're working with a traversable operator, then set the expr value
        if (TRAV_OP[operator]) {

          //using dot notation? convert into a sub-object
          if (~k.indexOf(".")) {
            var keyParts = k.split(".");
            k = keyParts.shift(); //we're using the first key, so remove it

            exprValue = value = convertDotToSubObject(keyParts, value);
          }

          //*if* the value is an array, then we're dealing with something like: $or, $and
          if (value instanceof Array) {

            exprValue = [];

            for (var i = value.length; i--;) {
              exprValue.push(parse(value[i]));
            }

          //otherwise we're dealing with $trav
          } else {
            exprValue = parse(value, k);
          }
        }

        testers.push(getExpr(operator, k, exprValue));
      }

    //otherwise we're comparing a particular value, so set to eq
    } else {
      testers.push(getExpr("$eq", key, statement));
    }

    var stmt =  {
      exprs: testers,
      k: key,
      test: function(value) {
        return test(stmt, value);
      }
    };

    return stmt;
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

  function convertDotToSubObject(keyParts, value) {

    var subObject    = {};
    var currentValue = subObject;

    for (var i = 0, n = keyParts.length - 1; i < n; i++) {
      currentValue = currentValue[keyParts[i]] = {};
    }

    currentValue[keyParts[i]] = value;

    return subObject;
  }

  /**
   */

  function getSelector(selector) {

    if (!selector) {

      return function(value) {
        return value;
      };

    } else if (typeof selector == "function") {
      return selector;
    }

    throw new Error("Unknown sift selector " + selector);
  }

  /**
   * sifts the given function
   * @param query the mongodb query
   * @param target the target array
   * @param rawSelector the selector for plucking data from the given target
   */

  function sift(query, target, rawSelector) {

    //must be an array
    if (typeof target != "object") {
      rawSelector = target;
      target = void 0;
    }

    var selector = getSelector(rawSelector);

    //build the filter for the sifter
    var sifter = parse(query);

    function filter(value) {
      return sifter.test(selector(value));
    }

    if (target) return target.filter(filter);

    filter.query = query;

    return filter;
  }

  sift.use = function(options) {
    if (options.operators) sift.useOperators(options.operators);
    if (typeof options === "function") options(sift);
  };

  sift.useOperators = function(operators) {
    for (var key in operators) {
      sift.useOperator(key, operators[key]);
    }
  };

  sift.useOperator = function(operator, optionsOrFn) {

    var options = {};

    if (typeof optionsOrFn == "object") {
      options = optionsOrFn;
    } else {
      options = { test: optionsOrFn };
    }

    var key = "$" + operator;
    _testers[key] = options.test;

    if (options.traversable || options.traverse) {
      TRAV_OP[key] = true;
    }
  };

  /* istanbul ignore next */
  if ((typeof module != "undefined") && (typeof module.exports != "undefined")) {
    module.exports = sift;
  } else
  if (typeof window != "undefined") {
    window.sift = sift;
  }
})();
