import { comparable, isFunction, isArray, getClassName } from "./utils";
import {
  spreadValueArray,
  createQueryFilters2,
  Options,
  createOrFilter,
  createAndFilter,
  createRegexpFilter,
  createFilter,
  numericalTester,
  createQueryTester,
  createTester
} from "./core";
import { Query } from "./query";
import { createSomeFilter, createEveryFilter } from "./filters";

const $eq = (params, options) =>
  createEveryFilter(createTester(params, options));
const $ne = (params, options) => {
  const test = createTester(params, {
    ...options,
    compare(a, b) {
      if (isArray(b) && !isArray(a)) {
        return true;
      }

      return options.compare(a, b);
    }
  });

  return createEveryFilter(item => !test(item));
};

const $gt = numericalTester(params =>
  createSomeFilter(item => comparable(item) > params)
);
const $gte = numericalTester(params =>
  createSomeFilter(item => comparable(item) >= params)
);
const $lt = numericalTester(params =>
  createSomeFilter(item => {
    return comparable(item) < params;
  })
);
const $lte = numericalTester(params =>
  createSomeFilter(item => comparable(item) <= params)
);
const $mod = numericalTester(([mod, equalsValue]) =>
  createSomeFilter(item => comparable(item) % mod === equalsValue)
);

const $exists = params => {
  return (values: any[]) => values.length > 0 === params;
};

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

const $and = (queries, options) => {
  const testers = queries.map(query => createQueryTester(query, options));

  return values => {
    return testers.every(test => values.some(test));
  };
};

const $options = () => () => true;

const $not = (query, options) => {
  const filter = createAndFilter(createQueryFilters2(query, options));
  return (item, key, parent) => !filter(item, key, parent);
};
const $size = size => item => item && item.length === size;
const $all = (queries, options) => {
  const filter = $and(queries, options);
  return (item, key, parent) => {
    return filter(item);
  };
};

const $type = clazz =>
  spreadValueArray(item => {
    return item == undefined
      ? false
      : item instanceof clazz || item.constructor === clazz;
  });
const $regex = (pattern, __options, { $options }) => {
  const tester =
    pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
  return spreadValueArray(createRegexpFilter(tester));
};
const $elemMatch = (query, options: Options) => {
  const test = createQueryTester(query, options);
  return (values: any[]) => values.every(test);
};
const $or = (queries: Query<any>[], options: Options) => {
  const testers = queries.map(query => createQueryTester(query, options));

  return (values: any[]) =>
    values.some(value => testers.some(test => test(value)));
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
