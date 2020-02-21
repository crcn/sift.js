import { createQueryTester, EqualsOperation } from "./es5m";
import * as operations from "./es5m/operations";

const tester = createQueryTester(
  { $test: 1 },
  {
    operations: {
      $where: operations.$where,
      $test: (params, ownertQuery) => {
        return new EqualsOperation(params, ownertQuery);
      }
    }
  }
);
