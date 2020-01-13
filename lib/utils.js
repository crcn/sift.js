"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeChecker = function(type) {
  var typeString = "[object " + type + "]";
  return function(value) {
    return exports.getClassName(value) === typeString;
  };
};
exports.getClassName = function(value) {
  return Object.prototype.toString.call(value);
};
exports.comparable = function(value) {
  if (value instanceof Date) {
    return value.getTime();
  } else if (exports.isArray(value)) {
    return value.map(exports.comparable);
  } else if (value && typeof value.toJSON === "function") {
    return value.toJSON();
  }
  return value;
};
exports.isArray = exports.typeChecker("Array");
exports.isObject = exports.typeChecker("Object");
exports.isFunction = exports.typeChecker("Function");
exports.isVanillaObject = function(value) {
  return (
    value &&
    (value.constructor === Object ||
      value.constructor === Array ||
      value.constructor.toString() === "function Object() { [native code] }" ||
      value.constructor.toString() === "function Array() { [native code] }") &&
    !value.toJSON
  );
};
exports.equals = function(a, b) {
  if (a == null && a == b) {
    return true;
  }
  if (a === b) {
    return true;
  }
  if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
    return false;
  }
  if (exports.isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0, length_1 = a.length; i < length_1; i++) {
      if (!exports.equals(a[i], b[i])) return false;
    }
    return true;
  } else if (exports.isObject(a)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      return false;
    }
    for (var key in a) {
      if (!exports.equals(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};
exports.hasNestedProperty = function(object, key) {
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
exports.nope = function() {
  return false;
};
