export type Key = string | number;
export type Comparator = (a, b) => boolean;
export const typeChecker = <TType>(type) => {
  const typeString = "[object " + type + "]";
  return function (value): value is TType {
    return getClassName(value) === typeString;
  };
};

const getClassName = (value) => Object.prototype.toString.call(value);

export const comparable = (value: any) => {
  if (value instanceof Date) {
    return value.getTime();
  } else if (isArray(value)) {
    return value.map(comparable);
  } else if (value && typeof value.toJSON === "function") {
    return value.toJSON();
  }

  return value;
};

export const coercePotentiallyNull = (value: any) =>
  value == null ? null : value;

export const isArray = typeChecker<Array<any>>("Array");
export const isObject = typeChecker<Object>("Object");
export const isFunction = typeChecker<Function>("Function");
export const isProperty = (item: any, key: any) => {
  return item.hasOwnProperty(key) && !isFunction(item[key]);
};
/**
 * The value at `a.b` on the array `a` itself, which the walker visits after each
 * element's `b` (so getters on Array subclasses work). If the array has no `b`,
 * it isn't a real value, and $ne/$in shouldn't treat it as null (#273).
 * Missing indexes (`a.5`) aren't included.
 */
export const isMissingArrayProperty = (key: Key, owner: any) =>
  Array.isArray(owner) && !(key in owner) && isNaN(Number(key));
/**
 * `obj[key]`, ignoring a value that only comes from Object.prototype. Nothing
 * sift reads this way (options, toJSON) lives there normally, so one showing up
 * means the prototype was polluted (#276). Values defined by a class still count.
 */
export const getIgnoringObjectPrototype = (obj: any, key: string) => {
  const value = obj[key];
  const inherited = Object.prototype[key];
  return inherited === undefined ||
    value !== inherited ||
    Object.prototype.hasOwnProperty.call(obj, key)
    ? value
    : undefined;
};
export const isVanillaObject = (value) => {
  return (
    value &&
    (value.constructor === Object ||
      value.constructor === Array ||
      value.constructor.toString() === "function Object() { [native code] }" ||
      value.constructor.toString() === "function Array() { [native code] }") &&
    !getIgnoringObjectPrototype(value, "toJSON")
  );
};

export const equals = (a, b) => {
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
    for (let i = 0, { length } = a; i < length; i++) {
      if (!equals(a[i], b[i])) return false;
    }
    return true;
  } else if (isObject(a)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      return false;
    }
    for (const key in a) {
      if (!Object.prototype.hasOwnProperty.call(a, key)) continue;
      if (!equals(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};
