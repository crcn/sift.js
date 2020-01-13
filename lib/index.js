"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operations_1 = require("./operations");
var core_1 = require("./core");
exports.EqualsOperation = core_1.EqualsOperation;
var createDefaultQueryTester = function(query, _a) {
  var _b = _a === void 0 ? {} : _a,
    compare = _b.compare,
    operations = _b.operations;
  return core_1.createQueryTester(query, {
    compare: compare,
    operations: Object.assign({}, { $and: operations_1.$and }, operations || {})
  });
};
exports.default = createDefaultQueryTester;
