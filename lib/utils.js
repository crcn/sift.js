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
  }
  return value;
};
exports.comparable = comparable;
var get = function(object, key) {
  return isFunction(object.get) ? object.get(key) : object[key];
};
exports.get = get;
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
  if (a == null && a == b) {
    return true;
  }
  if (a === b) {
    return true;
  }
  if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
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
var hasNestedProperty = function(object, key) {
  var parts = String(key).split(".");
  var current = object;
  if (parts.length === 1) {
    return current.hasOwnProperty(key);
  }
  for (var i = 0, n = parts.length - 1; i < n; i++) {
    current = current[parts[i]];
    if (!current) return false;
  }
  return current.hasOwnProperty(parts[parts.length - 1]);
};
exports.hasNestedProperty = hasNestedProperty;
var nope = function() {
  return false;
};
exports.nope = nope;
