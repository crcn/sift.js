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
var $eq = function(params, options) {
  return new core_1.EqualsOperation(params, options);
};
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
var $ne = function(params, options) {
  return new $Ne(params, options);
};
var $Nin = /** @class */ (function(_super) {
  __extends($Nin, _super);
  function $Nin() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  $Nin.prototype.init = function() {
    var _this = this;
    this._ops = this.params.map(function(query) {
      return core_1.createQueryOperation(query, _this.options);
    });
  };
  $Nin.prototype.reset = function() {
    _super.prototype.reset.call(this);
    for (var i = 0, length_1 = this._ops.length; i < length_1; i++) {
      this._ops[i].reset();
    }
  };
  $Nin.prototype.next = function(item) {
    console.log(item, this.params);
  };
  return $Nin;
})(core_1.BaseOperation);
var $nin = function(params, options) {
  return new $Nin(params, options);
};
exports.creators = {
  $eq: $eq,
  $ne: $ne,
  $nin: $nin
};
