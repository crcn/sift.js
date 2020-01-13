import { createQueryTester, EqualsOperation } from "./es5m";
import * as operations from "./operations";

const tester = createQueryTester(
  { $test: 1 },
  {
    operations: {
      $where: defaultOperations.$where,
      $test: (params, ownertQuery) => {
        return new EqualsOperation(params, ownertQuery);
      }
    }
  }
);
