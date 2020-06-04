import * as defaultOperations from "./operations";
import {
  Query,
  Options,
  createQueryTester,
  EqualsOperation,
  createEqualsOperation
} from "./core";

const createDefaultQueryTester = <TItem, TSchema = TItem>(
  query: Query<TSchema>,
  { compare, operations }: Partial<Options> = {}
) => {
  return createQueryTester<TItem, TSchema>(query, {
    compare: compare,
    operations: Object.assign({}, defaultOperations, operations)
  });
};

export { Query, EqualsOperation, createQueryTester, createEqualsOperation };
export * from "./operations";

export default createDefaultQueryTester;
