"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("./operations");
var core_1 = require("./core");
exports.EqualsOperation = core_1.EqualsOperation;
var utils_1 = require("./utils");
var createRootTester = function(query, _a) {
  var _b = _a === void 0 ? {} : _a,
    compare = _b.compare,
    operations = _b.operations;
  var operation = core_1.createQueryOperation(query, null, {
    compare: compare || utils_1.equals,
    operations: Object.assign({}, operations_1.creators, operations || {})
  });
  return function(item, key, owner) {
    operation.reset();
    operation.next(item, key, owner);
    return operation.success;
  };
};
exports.default = createRootTester;
