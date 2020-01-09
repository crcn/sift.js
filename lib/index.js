"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var defaultOperations = require("./operations");
var core_1 = require("./core");
var createFilter = function(query, _a) {
  var _b = _a === void 0 ? {} : _a,
    compare = _b.compare,
    expressions = _b.expressions;
  return core_1.createAndFilter(
    core_1.createQueryFilters(query, {
      compare: compare || utils_1.equals,
      expressions: Object.assign({}, defaultOperations, expressions)
    })
  );
};
exports.default = createFilter;
