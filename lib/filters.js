"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var createSomeFilter = function(test) {
  return function(values) {
    console.log("V", values);
    return values.some(test);
  };
};
exports.createSomeFilter = createSomeFilter;
var createEveryFilter = function(test) {
  return function(values) {
    return values.every(test);
  };
};
exports.createEveryFilter = createEveryFilter;
var createNestedFilter = function(filter) {
  return function(values) {
    var result = filter(values, null, null);
    if (!result && values.length && utils_1.isArray(values[0])) {
      return values.every(function(nestedArray) {
        return filter(nestedArray, null, null);
      });
    }
    return result;
  };
};
exports.createNestedFilter = createNestedFilter;
