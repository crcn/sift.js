const typeChecker = <TType>(type) => {
  const typeString = "[object " + type + "]";
  return function(value): value is TType {
    return Object.prototype.toString.call(value) === typeString;
  };
};

const comparable = (value: any) => {
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

const isArray = typeChecker<Array<any>>("Array");
const isObject = typeChecker<Object>("Object");
const isFunction = typeChecker<Function>("Function");
const isVanillaObject = value => {
  return (
    value &&
    (value.constructor === Object ||
      value.constructor === Array ||
      value.constructor.toString() === "function Object() { [native code] }" ||
      value.constructor.toString() === "function Array() { [native code] }") &&
    !value.toJSON
  );
};

const equals = (a, b) => {
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
    for (let i = 0, { length } = a; i < length; i++) {
      if (!equals(a[i], b[i])) return false;
    }
    return true;
  } else if (isObject(a)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      return false;
    }
    for (const key in a) {
      if (!equals(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};

const getValue = (root: any, propertyPath: string[]) => {
  let current = root;
  if (propertyPath.length === 1) {
    return root[propertyPath[0]];
  }
  for (const pathPart of propertyPath) {
    current = propertyPath[pathPart];
  }
  return current;
};

export {
  isFunction,
  isArray,
  isObject,
  equals,
  isVanillaObject,
  comparable,
  getValue
};
