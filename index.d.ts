import {
  Query,
  Options,
  createQueryTester,
  EqualsOperation,
  createEqualsOperation
} from "./core";
declare const createDefaultQueryTester: <TItem>(
  query: Query,
  { compare, operations }?: Partial<Options>
) => (item: TItem, key?: import("./utils").Key, owner?: any) => any;
export { Query, EqualsOperation, createQueryTester, createEqualsOperation };
export * from "./operations";
export default createDefaultQueryTester;
