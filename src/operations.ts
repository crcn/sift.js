import { comparable, isFunction, isArray } from "./utils";
import {
  spreadValueArray,
  createQueryFilters,
  Options,
  createOrFilter,
  createAndFilter,
  createRegexpTester,
  createTester,
  numericalOperation,
  Filter,
  getScopeValues
} from "./core";

const $eq = (params, scopePath, options) =>
  createTester(params, scopePath, options);
const $ne = (params, scopePath, options) => {
  const filter = $eq(params, scopePath, options);
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
  spreadValueArray((_item, key, parent) => {
    return parent.hasOwnProperty(key) === params;
  });

const $in = (params, scopePath, options) => {
  const filter = $or(params, scopePath, options);
  return (item, key, parent) => {
    return filter(item, key, parent);
  };
};

const $nin = (params, scopePath, options) => {
  const filter = $in(params, scopePath, options);
  return (item, key, value) => {
    return !filter(item, key, value);
  };
};

const $and = (queries, scopePath: string[], options) => {
  const filters = queries.map(query =>
    createOrFilter(createQueryFilters(query, [], options))
  );
  return item => {
    const values = getScopeValues(item, scopePath);

    return filters.every(filter => values.some(filter));
  };
};

const $options = () => () => true;

const $not = (query, scopePath: string[], options) => {
  const filter = createAndFilter(createQueryFilters(query, scopePath, options));
  return (item, key, parent) => !filter(item, key, parent);
};
const $size = size => item => item && item.length === size;
const $all = (queries, scopePath, options) => {
  const filter = $and(queries, scopePath, options);
  return (item, key, parent) => {
    return filter(item);
  };
};

const traverseScope = (item, scopePath: string[], depth: number = 0) => {
  if (depth === scopePath.length) {
    return item;
  }

  const currentKey = scopePath[depth];

  if (isArray(item) && isNaN(Number(currentKey))) {
    for (let i = 0, { length } = item; i < length; i++) {
      traverseScope(item[i], scopePath, depth);
    }
  }
};
const $type = clazz =>
  spreadValueArray(item => {
    return item == undefined
      ? false
      : item instanceof clazz || item.constructor === clazz;
  });
const $regex = (pattern, _scopePath, _options, { $options }) => {
  const tester =
    pattern instanceof RegExp ? pattern : new RegExp(pattern, $options);
  return spreadValueArray(createRegexpTester(tester));
};
const $elemMatch = (query, scopePath: string[], options: Options) => {
  const filter = createAndFilter(createQueryFilters(query, scopePath, options));
  return filter;
};
const $or = (queries, scopePath: string[], options: Options) => {
  return createOrFilter(
    queries.map(query =>
      createAndFilter(createQueryFilters(query, scopePath, options))
    )
  );
};
const $nor = (params, scopePath, options: Options) => {
  const filter = $or(params, scopePath, options);
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
