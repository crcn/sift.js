"use strict";
function __export(m) {
  for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const defaultOperations = require("./operations");
const core_1 = require("./core");
exports.createQueryTester = core_1.createQueryTester;
exports.EqualsOperation = core_1.EqualsOperation;
exports.createEqualsOperation = core_1.createEqualsOperation;
const createDefaultQueryTester = (query, { compare, operations } = {}) => {
  return core_1.createQueryTester(query, {
    compare: compare,
    operations: Object.assign({}, defaultOperations, operations)
  });
};
__export(require("./operations"));
exports.default = createDefaultQueryTester;
//# sourceMappingURL=index.js.map
