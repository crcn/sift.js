"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typeChecker = function(type) {
  var typeString = "[object " + type + "]";
  return function(value) {
    return Object.prototype.toString.call(value) === typeString;
  };
};
var comparable = function(value) {
  if (value instanceof Date) {
    return value.getTime();
  } else if (isArray(value)) {
    return value.map(comparable);
  } else if (value && typeof value.toJSON === "function") {
    return value.toJSON();
  } else {
    return value;
  }
};
exports.comparable = comparable;
var isArray = typeChecker("Array");
exports.isArray = isArray;
var isObject = typeChecker("Object");
exports.isObject = isObject;
var isFunction = typeChecker("Function");
exports.isFunction = isFunction;
var isVanillaObject = function(value) {
  return (
    value &&
    (value.constructor === Object ||
      value.constructor === Array ||
      value.constructor.toString() === "function Object() { [native code] }" ||
      value.constructor.toString() === "function Array() { [native code] }") &&
    !value.toJSON
  );
};
exports.isVanillaObject = isVanillaObject;
var equals = function(a, b) {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0, length_1 = a.length; i < length_1; i++) {
      if (!equals(a[i], b[i])) return false;
    }
    return true;
  } else if (isObject(a)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      return false;
    }
    for (var key in a) {
      if (!equals(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};
exports.equals = equals;
var getValue = function(root, propertyPath) {
  var current = root;
  if (propertyPath.length === 1) {
    return root[propertyPath[0]];
  }
  for (
    var _i = 0, propertyPath_1 = propertyPath;
    _i < propertyPath_1.length;
    _i++
  ) {
    var pathPart = propertyPath_1[_i];
    current = propertyPath[pathPart];
  }
  return current;
};
exports.getValue = getValue;
