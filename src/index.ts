import { Query } from "./query";
import { equals } from "./utils";

import * as defaultOperations from "./operations";
import { createQueryTester, Options } from "./core";

const createFilter = <TItem>(
  query: Query<TItem>,
  { compare, expressions }: Partial<Options> = {}
) => {
  return createQueryTester(query, {
    compare: compare || equals,
    expressions: Object.assign({}, defaultOperations, expressions)
  });
};

export default createFilter;
