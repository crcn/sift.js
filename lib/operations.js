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
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("./core");
var utils_1 = require("./utils");
var $Ne = /** @class */ (function(_super) {
  __extends($Ne, _super);
  function $Ne() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  $Ne.prototype.init = function() {
    this._test = core_1.createTester(this.params, this.options.compare);
  };
  $Ne.prototype.reset = function() {
    _super.prototype.reset.call(this);
    this.success = true;
  };
  $Ne.prototype.next = function(item) {
    if (this._test(item)) {
      this.done = true;
      this.success = false;
    }
  };
  return $Ne;
})(core_1.BaseOperation);
var $ElemMatch = /** @class */ (function(_super) {
  __extends($ElemMatch, _super);
  function $ElemMatch() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  $ElemMatch.prototype.init = function() {
    this._queryOperation = core_1.createQueryOperation(
      this.params,
      this.owneryQuery,
      this.options
    );
  };
  $ElemMatch.prototype.reset = function() {
    this._queryOperation.reset();
  };
  $ElemMatch.prototype.next = function(item, key, owner) {
    this._queryOperation.next(item, key, owner);
    this.done = this._queryOperation.done;
    this.success = this._queryOperation.success;
  };
  return $ElemMatch;
})(core_1.BaseOperation);
var $Not = /** @class */ (function(_super) {
  __extends($Not, _super);
  function $Not() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  $Not.prototype.next = function(item, key, owner) {
    _super.prototype.next.call(this, item, key, owner);
    this.success = !this.success;
  };
  return $Not;
})($ElemMatch);
var $Or = /** @class */ (function(_super) {
  __extends($Or, _super);
  function $Or() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  $Or.prototype.init = function() {
    var _this = this;
    this._ops = this.params.map(function(op) {
      return core_1.createQueryOperation(op, null, _this.options);
    });
  };
  $Or.prototype.reset = function() {
    this.done = false;
    this.success = false;
    for (var i = 0, length_1 = this._ops.length; i < length_1; i++) {
      this._ops[i].reset();
    }
  };
  $Or.prototype.next = function(item, key, owner) {
    var done = false;
    var success = false;
    for (var i = 0, length_2 = this._ops.length; i < length_2; i++) {
      var op = this._ops[i];
      op.next(item, key, owner);
      if (op.success) {
        done = true;
        success = op.success;
        break;
      }
    }
    this.success = success;
    this.done = done;
  };
  return $Or;
})(core_1.BaseOperation);
var $Nor = /** @class */ (function(_super) {
  __extends($Nor, _super);
  function $Nor() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  $Nor.prototype.next = function(item, key, owner) {
    _super.prototype.next.call(this, item, key, owner);
    this.success = !this.success;
  };
  return $Nor;
})($Or);
var $Exists = /** @class */ (function(_super) {
  __extends($Exists, _super);
  function $Exists() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  $Exists.prototype.next = function(item, key, owner) {
    if (owner.hasOwnProperty(key) === this.params) {
      this.done = true;
      this.success = true;
    }
  };
  return $Exists;
})(core_1.BaseOperation);
var $And = /** @class */ (function(_super) {
  __extends($And, _super);
  function $And(params, owneryQuery, options) {
    return (
      _super.call(
        this,
        params,
        owneryQuery,
        options,
        params.map(function(query) {
          return core_1.createQueryOperation(query, owneryQuery, options);
        })
      ) || this
    );
  }
  $And.prototype.next = function(item, key, owner) {
    this.childrenNext(item, key, owner);
  };
  return $And;
})(core_1.GroupOperation);
var $eq = function(params, owneryQuery, options) {
  return new core_1.EqualsOperation(params, owneryQuery, options);
};
var $ne = function(params, owneryQuery, options) {
  return new $Ne(params, owneryQuery, options);
};
var $or = function(params, owneryQuery, options) {
  return new $Or(params, owneryQuery, options);
};
var $nor = function(params, owneryQuery, options) {
  return new $Nor(params, owneryQuery, options);
};
var $elemMatch = function(params, owneryQuery, options) {
  return new $ElemMatch(params, owneryQuery, options);
};
var $nin = function(params, owneryQuery, options) {
  return new $Nor(params, owneryQuery, options);
};
var $in = function(params, owneryQuery, options) {
  return new $Or(params, owneryQuery, options);
};
var $lt = core_1.numericalOperationCreator(function(
  params,
  owneryQuery,
  options
) {
  return new core_1.EqualsOperation(
    function(b) {
      return b < params;
    },
    owneryQuery,
    options
  );
});
var $lte = core_1.numericalOperationCreator(function(
  params,
  owneryQuery,
  options
) {
  return new core_1.EqualsOperation(
    function(b) {
      return b <= params;
    },
    owneryQuery,
    options
  );
});
var $gt = core_1.numericalOperationCreator(function(
  params,
  owneryQuery,
  options
) {
  return new core_1.EqualsOperation(
    function(b) {
      return b > params;
    },
    owneryQuery,
    options
  );
});
var $gte = core_1.numericalOperationCreator(function(
  params,
  owneryQuery,
  options
) {
  return new core_1.EqualsOperation(
    function(b) {
      return b >= params;
    },
    owneryQuery,
    options
  );
});
var $mod = function(_a, owneryQuery, options) {
  var mod = _a[0],
    equalsValue = _a[1];
  return new core_1.EqualsOperation(
    function(b) {
      return utils_1.comparable(b) % mod === equalsValue;
    },
    owneryQuery,
    options
  );
};
var $exists = function(params, owneryQuery, options) {
  return new $Exists(params, owneryQuery, options);
};
var $regex = function(pattern, owneryQuery, options) {
  return new core_1.EqualsOperation(
    new RegExp(pattern, owneryQuery.$options),
    owneryQuery,
    options
  );
};
var $not = function(params, owneryQuery, options) {
  return new $Not(params, owneryQuery, options);
};
var $type = function(clazz, owneryQuery, options) {
  return new core_1.EqualsOperation(
    function(b) {
      return b != null ? b instanceof clazz || b.constructor === clazz : false;
    },
    owneryQuery,
    options
  );
};
var $and = function(params, ownerQuery, options) {
  return new $And(params, ownerQuery, options);
};
var $all = $and;
var $size = function(params, ownerQuery, options) {
  return new core_1.EqualsOperation(
    function(b) {
      return b && b.length === params;
    },
    ownerQuery,
    options
  );
};
var $options = function() {
  return null;
};
var $where = function(params, ownerQuery, options) {
  var test;
  if (utils_1.isFunction(params)) {
    test = params;
  } else if (!process.env.CSP_ENABLED) {
    test = new Function("obj", "return " + params);
  } else {
    throw new Error(
      'In CSP mode, sift does not support strings in "$where" condition'
    );
  }
  return new core_1.EqualsOperation(
    function(b) {
      return test.bind(b)(b);
    },
    ownerQuery,
    options
  );
};
exports.creators = {
  $lt: $lt,
  $lte: $lte,
  $mod: $mod,
  $gt: $gt,
  $gte: $gte,
  $eq: $eq,
  $or: $or,
  $nor: $nor,
  $and: $and,
  $options: $options,
  $regex: $regex,
  $ne: $ne,
  $nin: $nin,
  $all: $all,
  $size: $size,
  $in: $in,
  $type: $type,
  $elemMatch: $elemMatch,
  $exists: $exists,
  $not: $not,
  $where: $where
};
