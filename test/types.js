"use strict";
exports.__esModule = true;
var __1 = require("..");
__1["default"]({ $gt: 10 });
__1["default"]({ $gt: "10" });
__1["default"]({ $gt: new Date(10) });
__1["default"]({ $gt: "10" });
__1["default"]({ $eq: [] });
__1["default"]({ $gte: 10 });
__1["default"]({ $gte: "10" });
__1["default"]({ $gte: new Date(10) });
__1["default"]({ $lt: 10 });
__1["default"]({ $lt: "10" });
__1["default"]({ $lt: new Date(10) });
__1["default"]({ $lte: 10 });
__1["default"]({ $lte: "10" });
__1["default"]({ $lte: new Date(10) });
__1["default"]({
  name: "a",
  last: { $eq: "a", $ne: "a", $in: ["a"], $nin: ["a"], $or: [{ $eq: "a" }] }
});
// fail
// sift<Person>({ name: 5, last: { $eq: "a" } });
__1["default"]({ name: "a", last: { $elemMatch: { $eq: "a" } } });
__1["default"]({ name: "a", address: { $elemMatch: { zip: 55124 } } });
// pass
__1["default"]({
  name: "a",
  address: { $elemMatch: {} },
  $or: [{ name: "jeffery", last: "joe" }]
});
__1["default"]({ "address.zip": 4, name: "a" });
__1["default"]({ name: 5 });
__1["default"]({ name: { $gt: 10 } });
// fail
// sift<Something>({ name: { $gt: new Date(10) } });
__1["default"]({ name: { $gt: "5" } });
[{ string: "hello", number: 1 }].filter(
  __1["default"]({
    string: "a",
    number: 1
  })
);
var obj = {
  string: "foo",
  number: 123,
  date: new Date(),
  boolean: true,
  arrayOfNumbers: [1, 2, 3],
  arrayOfStrings: ["a", "b", "c"],
  nestedArrayOfNumbers: [[1], [2], [3]],
  doubleNested: [[[1], [2]], [[1, 2]]],
  tripleNested: [[[[1]]]],
  arrayOfObjects: [{ a: 1 }, { a: 2 }],
  nestedArrayOfObjects: [[{ a: 1 }], [{ a: 2 }], [{ a: 3 }]],
  nested: {
    prop: true
  },
  foo: {
    bar: {
      baz: 1
    }
  }
};
[obj].filter(
  __1["default"]({
    number: {
      $in: [123, 2, 3] // Type '{ $in: number[]; }' is not assignable to type 'number | alueQuery<number>   undefined'. Object literal may only specify known properties, and '$in' does not exist in type 'ValueQuery<number>'.
    }
  })
);
var a = [obj].some(
  __1["default"]({
    // string: 'foo',
    // number: 123,
    // date: new Date(0),
    // boolean: true,
    // arrayOfNumbers: [1, 2, 3],
    // arrayOfStrings: ['a', 'b', 'c'],
    // nestedArrayOfNumbers: [[1], [2], [3]],
    // doubleNested: [[[1], [2]], [[1, 2]]],
    // tripleNested: [[[[1]]]],
    // arrayOfObjects: [{ a: 1 }, { a: 2 }],
    // nestedArrayOfObjects: [[{ a: 1 }], [{ a: 2 }], [{ a: 3 }]],
    // nested: {
    //   prop: true,
    // },
    foo: {
      $elemMatch: {
        bar: {
          $elemMatch: {
            baz: {
              $in: [1, 2, 3]
            }
          }
        }
      }
    }
  })
); // returns false
console.log(a);
