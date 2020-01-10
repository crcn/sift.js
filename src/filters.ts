import { Tester, Filter } from "./core";
import { isArray } from "./utils";

const createSomeFilter = (test: Tester) => {
  return (values: any[]) => {
    console.log("V", values);
    return values.some(test);
  };
};

const createEveryFilter = (test: Tester) => {
  return (values: any[]) => values.every(test);
};

const createNestedFilter = (filter: Filter) => {
  return (values: any[]) => {
    const result = filter(values, null, null);
    if (!result && values.length && isArray(values[0])) {
      return values.every(nestedArray => filter(nestedArray, null, null));
    }
    return result;
  };
};

export { createSomeFilter, createEveryFilter, createNestedFilter };
