/*
 * Sift
 *
 * Copryright 2011, Craig Condon
 * Licensed under MIT
 *
 * Inspired by mongodb's query language
 */


(function () {

  /**
   */

  var operators = {

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
        if (a[i](b)) {
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
        if (a[i](b)) {
          return false;
        }
      }

      return true;
    },

    /**
     */

    $and: function(a, b) {

      for (var i = a.length; i--;) {
        if (!a[i](b)) {
          return false;
        }
      }

      return true;
    },

    /**
     */

    $trav: function(a, b, k) {


      if (b instanceof Array) {

        for (var i = b.length; i--;) {
          var subb = b[i];
          if (subb[a.k] && test(a, subb[a.k])) return true;
        }

        return false;
      }

      //continue to traverse even if there isn't a value - this is needed for
      //something like name:{$exists:false}
      // console.log(a(b ? b[k] : void 0), b);

      return a(b ? b[k] : void 0);
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

  function parse (query, key) {

    var a = query;
    var operatorKey;

    if (query == null || typeof query !== "object") {

      if (key && key.charCodeAt(0) !== 36) {
        operatorKey = "$trav";
        a = parse(query);
      } else {
        operatorKey = "$eq";
      }

    } else {
      var a = [];
      if (query.constructor === Object) {
        for (var key in query) {
          a.push(parse(query[key], key));
        }
      } else if (query.constructor === Array) {
        for (var i = 0, n = query.length; i < n; i++) {
          a.push(parse(query[i]));
        }
      }

      operatorKey = "$and";
    }

    if (_prepare[operatorKey]) {
      a = _prepare[operatorKey](comparable(a));
    }

    var operator = operators[operatorKey];


    return function (b) {
      return operator(a, comparable(b), key);
    }
  }

  /**
   * sifts the given function
   * @param query the mongodb query
   * @param target the target array
   * @param rawSelector the selector for plucking data from the given target
   */

  function sift(query) {
    return parse(query);
  }

  /* istanbul ignore next */
  if ((typeof module != "undefined") && (typeof module.exports != "undefined")) {
    module.exports = sift;
  } else
  if (typeof window != "undefined") {
    window.sift = sift;
  }
})();