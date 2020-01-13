import * as defaultOperations from "./operations";
import { Query, Options, createQueryTester, EqualsOperation } from "./core";

const createDefaultQueryTester = (
  query: Query,
  { compare, operations }: Partial<Options> = {}
) => {
  return createQueryTester(query, {
    compare: compare,
    operations: Object.assign({}, defaultOperations, operations || {})
  });
};

export { Query, EqualsOperation };

export default createDefaultQueryTester;
