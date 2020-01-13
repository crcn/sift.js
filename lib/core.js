"use strict";
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
/**
 * Walks through each value given the context - used for nested operations. E.g:
 * { "person.address": { $eq: "blarg" }}
 */
var walkKeyPathValues = function(item, keyPath, next, depth, key, owner) {
  var currentKey = keyPath[depth];
  // if array, then try matching. Might fall through for cases like:
  // { $eq: [1, 2, 3] }, [ 1, 2, 3 ].
  if (utils_1.isArray(item) && isNaN(Number(currentKey))) {
    for (var i = 0, length_1 = item.length; i < length_1; i++) {
      // if FALSE is returned, then terminate walker. For operations, this simply
      // means that the search critera was met.
      if (!walkKeyPathValues(item[i], keyPath, next, depth, i, item)) {
        return false;
      }
    }
  }
  if (depth === keyPath.length || item == null) {
    return next(item, key, owner);
  }
  return walkKeyPathValues(
    item[currentKey],
    keyPath,
    next,
    depth + 1,
    currentKey,
    item
  );
};
var BaseOperation = /** @class */ (function() {
  function BaseOperation(params, owneryQuery, options) {
    this.params = params;
    this.owneryQuery = owneryQuery;
    this.options = options;
    this.init();
  }
  BaseOperation.prototype.init = function() {};
  BaseOperation.prototype.reset = function() {
    this.done = false;
    this.success = false;
  };
  return BaseOperation;
})();
exports.BaseOperation = BaseOperation;
var GroupOperation = /** @class */ (function(_super) {
  __extends(GroupOperation, _super);
  function GroupOperation(params, owneryQuery, options, _children) {
    var _this = _super.call(this, params, owneryQuery, options) || this;
    _this._children = _children;
    return _this;
  }
  /**
   */
  GroupOperation.prototype.reset = function() {
    this.success = false;
    this.done = false;
    for (var i = 0, length_2 = this._children.length; i < length_2; i++) {
      this._children[i].reset();
    }
  };
  /**
   */
  GroupOperation.prototype.childrenNext = function(item, key, owner) {
    var done = true;
    var success = true;
    for (var i = 0, length_3 = this._children.length; i < length_3; i++) {
      var childOperation = this._children[i];
      childOperation.next(item, key, owner);
      if (!childOperation.success) {
        success = false;
      }
      if (childOperation.done) {
        if (!childOperation.success) {
          break;
        }
      } else {
        done = false;
      }
    }
    this.done = done;
    this.success = success;
  };
  return GroupOperation;
})(BaseOperation);
exports.GroupOperation = GroupOperation;
var QueryOperation = /** @class */ (function(_super) {
  __extends(QueryOperation, _super);
  function QueryOperation() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  /**
   */
  QueryOperation.prototype.next = function(item, key, parent) {
    this.childrenNext(item, key, parent);
  };
  return QueryOperation;
})(GroupOperation);
exports.QueryOperation = QueryOperation;
var NestedOperation = /** @class */ (function(_super) {
  __extends(NestedOperation, _super);
  function NestedOperation(keyPath, params, owneryQuery, options, children) {
    var _this =
      _super.call(this, params, owneryQuery, options, children) || this;
    _this.keyPath = keyPath;
    /**
     */
    _this._nextNestedValue = function(value, key, owner) {
      _this.childrenNext(value, key, owner);
      return !_this.done;
    };
    return _this;
  }
  /**
   */
  NestedOperation.prototype.next = function(item, key, parent) {
    walkKeyPathValues(
      item,
      this.keyPath,
      this._nextNestedValue,
      0,
      key,
      parent
    );
  };
  return NestedOperation;
})(GroupOperation);
exports.NestedOperation = NestedOperation;
exports.createTester = function(a, compare) {
  if (a instanceof Function) {
    return a;
  }
  if (a instanceof RegExp) {
    return function(b) {
      return typeof b === "string" && a.test(b);
    };
  }
  var comparableA = utils_1.comparable(a);
  return function(b) {
    return compare(comparableA, utils_1.comparable(b));
  };
};
var EqualsOperation = /** @class */ (function(_super) {
  __extends(EqualsOperation, _super);
  function EqualsOperation() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  EqualsOperation.prototype.init = function() {
    this._test = exports.createTester(this.params, this.options.compare);
  };
  EqualsOperation.prototype.next = function(item, key, parent) {
    if (this._test(item, key, parent)) {
      this.done = true;
      this.success = true;
    }
  };
  return EqualsOperation;
})(BaseOperation);
exports.EqualsOperation = EqualsOperation;
var NopeOperation = /** @class */ (function(_super) {
  __extends(NopeOperation, _super);
  function NopeOperation() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  NopeOperation.prototype.next = function() {
    this.done = true;
    this.success = false;
  };
  return NopeOperation;
})(BaseOperation);
exports.NopeOperation = NopeOperation;
exports.numericalOperationCreator = function(createNumericalOperation) {
  return function(params, owneryQuery, options) {
    return params == null
      ? new NopeOperation(params, owneryQuery, options)
      : createNumericalOperation(params, owneryQuery, options);
  };
};
var createOperation = function(name, params, parentQuery, options) {
  var operationCreator = options.operations[name];
  if (!operationCreator) {
    throw new Error("Unsupported operation: " + name);
  }
  return operationCreator(params, parentQuery, options);
};
var containsOperation = function(query) {
  for (var key in query) {
    if (key.charAt(0) === "$") return true;
  }
  return false;
};
var createNestedOperation = function(
  keyPath,
  nestedQuery,
  owneryQuery,
  options
) {
  if (containsOperation(nestedQuery)) {
    var _a = createQueryOperations(nestedQuery, options),
      selfOperations = _a[0],
      nestedOperations = _a[1];
    if (nestedOperations.length) {
      throw new Error(
        "Property queries must contain only operations, or exact objects."
      );
    }
    return new NestedOperation(
      keyPath,
      nestedQuery,
      owneryQuery,
      options,
      selfOperations
    );
  }
  return new NestedOperation(keyPath, nestedQuery, owneryQuery, options, [
    new EqualsOperation(nestedQuery, owneryQuery, options)
  ]);
};
exports.createQueryOperation = function(query, owneryQuery, options) {
  var _a = createQueryOperations(query, options),
    selfOperations = _a[0],
    nestedOperations = _a[1];
  var ops = __spreadArrays(
    [new NestedOperation([], query, owneryQuery, options, selfOperations)],
    nestedOperations
  );
  if (ops.length === 1) {
    return ops[0];
  }
  return new QueryOperation(query, owneryQuery, options, ops);
};
var createQueryOperations = function(query, options) {
  var selfOperations = [];
  var nestedOperations = [];
  if (!utils_1.isVanillaObject(query)) {
    query = { $eq: query };
  }
  for (var key in query) {
    if (key.charAt(0) === "$") {
      var op = createOperation(key, query[key], query, options);
      // probably just a flag for another operation (like $options)
      if (op != null) {
        selfOperations.push(op);
      }
    } else {
      nestedOperations.push(
        createNestedOperation(key.split("."), query[key], query, options)
      );
    }
  }
  return [selfOperations, nestedOperations];
};
