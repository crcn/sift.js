import { comparable, isFunction } from "./utils";
import {
  spreadValueArray,
  createQueryFilters,
  Options,
  createOrFilter,
  createAndFilter,
  createRegexpTester,
  createTester,
  numericalOperation,
  createNestedFilter
} from "./core";

const $eq = (params, options) =>
  spreadValueArray(createTester(params, options));
const $ne = (params, options) => {
  const filter = $eq(params, options);
  return (item, key, parent) => {
    return !filter(item, key, parent);
  };
};

const $gt = numericalOperation(params => item => comparable(item) > params);
const $gte = numericalOperation(params => item => comparable(item) >= params);
const $lt = numericalOperation(params => item => comparable(item) < params);
const $lte = numericalOperation(params => item => comparable(item) <= params);
const $mod = numericalOperation(([mod, equalsValue]) => item =>
  comparable(item) % mod === equalsValue
);

const $exists = params =>
  spreadValueArray((item, key, parent) => {
    return parent.hasOwnProperty(key) === params;
  });

const $in = (params, options) => {
  const filter = $or(params, options);
  return (item, key, parent) => {
    return filter(item, key, parent);
  };
};

const $nin = (params, options) => {
  const filter = $in(params, options);
  return (item, key, value) => {
    return !filter(item, key, value);
  };
};

const $and = (params, options) => {
  const filter = createAndFilter(
    params.map(query => createOrFilter(createQueryFilters(query, options)))
  );
  return filter;
};

const $options = params => item => true;

const $not = (query, options) => {
  const filter = createAndFilter(createQueryFilters(query, options));
  return (item, key, parent) => !filter(item, key, parent);
};
const $size = size => item => item && item.length === size;
const $all = (query, options) => $and(query, options);
const $type = clazz =>
  spreadValueArray(item => {
    return item == undefined
      ? false
      : item instanceof clazz || item.constructor === clazz;
  });
const $regex = (pattern, options, { $options }) => {
  const tester =
    pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
  return spreadValueArray(createRegexpTester(tester));
};
const $elemMatch = (query, options: Options) => {
  const filter = createAndFilter(createQueryFilters(query, options));
  return filter;
};
const $or = (params, options: Options) => {
  return createOrFilter(
    params.map(query => createAndFilter(createQueryFilters(query, options)))
  );
};
const $nor = (params, options: Options) => {
  const filter = $or(params, options);
  return (item, key, parent) => !filter(item, key, parent);
};
const $where = query => {
  let tester;

  if (isFunction(query)) {
    tester = query;
  } else if (!process.env.CSP_ENABLED) {
    tester = new Function("obj", "return " + query);
  } else {
    throw new Error(
      `In CSP mode, sift does not support strings in "$where" condition`
    );
  }

  return item => tester.bind(item)(item);
};

export {
  $eq,
  $ne,
  $gt,
  $gte,
  $lt,
  $lte,
  $elemMatch,
  $and,
  $or,
  $nor,
  $where,
  $regex,
  $type,
  $all,
  $size,
  $options,
  $exists,
  $not,
  $in,
  $nin,
  $mod
};
