import { Query } from "./query";
import {
  isArray,
  get,
  nope,
  hasNestedProperty,
  isVanillaObject,
  equals,
  isFunction,
  comparable
} from "./utils";

import * as defaultOperations from "./operations";
import {
  createNestedFilter,
  createQueryFilters,
  createAndFilter,
  Options,
  Key,
  Filter,
  CustomOperations,
  FilterCreator
} from "./core";

const createFilter = <TItem>(
  query: Query<TItem>,
  { compare, expressions }: Partial<Options> = {}
) => {
  return createAndFilter(
    createQueryFilters(query, {
      compare: compare || equals,
      expressions: Object.assign({}, defaultOperations, expressions)
    })
  );
};

export default createFilter;
