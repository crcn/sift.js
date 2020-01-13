import { Query, creators } from "./operations";
import {
  Options,
  createQueryOperation,
  EqualsOperation,
  BaseOperation
} from "./core";
import { equals, Key } from "./utils";

const createRootTester = (
  query: Query,
  { compare, operations }: Partial<Options> = {}
) => {
  const operation = createQueryOperation(query, null, {
    compare: compare || equals,
    operations: Object.assign({}, creators, operations || {})
  });
  return (item, key?: Key, owner?: any) => {
    operation.reset();
    operation.next(item, key, owner);
    return operation.success;
  };
};

export { Query, EqualsOperation };

export default createRootTester;
