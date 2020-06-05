"use strict";
exports.__esModule = true;
var __1 = require("..");
__1["default"]({ $gt: 10 });
__1["default"]({ $gt: "10" });
__1["default"]({ $gt: new Date(10) });
__1["default"]({ $gt: "10" });
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
__1["default"]({ name: "a", friends: { $elemMatch: { name: "first" } } });
__1["default"]({ name: "a", address: { zip: 55555 } });
// pass
__1["default"]({
  name: "a",
  $or: [{ name: "jeffery", last: "joe" }]
});
__1["default"]({ "address.zip": 4, name: "a" });
__1["default"]({ name: 5 });
__1["default"]({ name: { $gt: 10 }, $where: function() {} });
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
      baz: 1,
      biz: 5
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
    "foo.bar.baz": {
      $in: [1, 2, 3]
    },
    foo: {
      bar: {
        // $in: [1, 2, 3] should fail
        baz: 4,
        biz: 5
      }
    }
  })
); // returns false
console.log(a);
[
  { tags: ["books", "programming", "travel"] },
  { tags: ["travel", "cooking"] }
].filter(__1["default"]({ tags: { $all: ["books", "programming"] } }));
["craig", "john", "jake"].filter(__1["default"](/^j/));
["craig", "tim", "jake"].filter(
  __1["default"]({ $not: { $in: ["craig", "tim"] } })
);
//intersecting arrays
var result1 = ["hello", "sifted", "array!"].filter(
  __1["default"]({ $in: ["hello", "world"] })
); //['hello']
//regexp filter
var result2 = ["craig", "john", "jake"].filter(__1["default"](/^j/)); //['john','jake']
// function filter
var testFilter = __1["default"]({
  //you can also filter against functions
  name: function(value) {
    return value.length == 5;
  }
});
[
  {
    name: "craig"
  },
  {
    name: "john"
  },
  {
    name: "jake"
  }
].filter(testFilter); // filtered: [{ name: 'craig' }]
//you can test *single values* against your custom sifter
testFilter({ name: "sarah" }); //true
testFilter({ name: "tim" }); //false
[3, 4, 5, 6, 7].filter(__1["default"]({ $exists: true })); // [6, 7]
__1.createQueryTester(
  { $eq: 5 },
  { operations: { $eq: __1.$eq, $in: __1.$in } }
);
["Brazil", "Haiti", "Peru", "Chile"].filter(
  __1["default"]({ $in: ["Costa Rica", "Brazil"] })
);
[{ name: "Craig", location: "Brazil" }].filter(
  __1["default"]({ location: { $in: ["Costa Rica", "Brazil"] } })
);
["Brazil", "Haiti", "Peru", "Chile"].filter(
  __1["default"]({ $nin: ["Costa Rica", "Brazil"] })
);
[{ name: "Craig", city: "Minneapolis" }, { name: "Tim" }].filter(
  __1["default"]({ city: { $exists: false } })
);
[0, 1, 2, 3].filter(__1["default"]({ $gte: 2 }));
[0, 1, 2, 3].filter(__1["default"]({ $gt: 2 }));
[0, 1, 2, 3].filter(__1["default"]({ $lte: 2 }));
[0, 1, 2, 3].filter(__1["default"]({ $lt: 2 }));
[{ state: "MN" }, { state: "CA" }, { state: "WI" }].filter(
  __1["default"]({ state: { $eq: "MN" } })
);
[{ state: "MN" }, { state: "CA" }, { state: "WI" }].filter(
  __1["default"]({ state: "MN" })
);
[{ state: "MN" }, { state: "CA" }, { state: "WI" }].filter(
  __1["default"]({ state: { $ne: "MN" } })
);
[100, 200, 300, 400, 500, 600].filter(__1["default"]({ $mod: [3, 0] }));
[
  { tags: ["books", "programming", "travel"] },
  { tags: ["travel", "cooking"] }
].filter(__1["default"]({ tags: { $all: ["books", "programming"] } }));
[
  { name: "Craig", state: "MN" },
  { name: "Tim", state: "MN" },
  { name: "Joe", state: "CA" }
].filter(__1["default"]({ $and: [{ name: "Craig" }, { state: "MN" }] }));
[
  { name: "Craig", state: "MN" },
  { name: "Tim", state: "MN" },
  { name: "Joe", state: "CA" }
].filter(__1["default"]({ $or: [{ name: "Craig" }, { state: "MN" }] }));
[
  { name: "Craig", state: "MN" },
  { name: "Tim", state: "MN" },
  { name: "Joe", state: "CA" }
].filter(__1["default"]({ $nor: [{ name: "Craig" }, { state: "MN" }] }));
[{ tags: ["food", "cooking"] }, { tags: ["traveling"] }].filter(
  __1["default"]({ tags: { $size: 2 } })
);
[new Date(), 4342, "hello world"].filter(__1["default"]({ $type: Date })); //returns single date
[new Date(), 4342, "hello world"].filter(__1["default"]({ $type: String })); //returns ['hello world']
["frank", "fred", "sam", "frost"].filter(
  __1["default"]({ $regex: /^f/i, $nin: ["frank"] })
); // ["fred", "frost"]
["frank", "fred", "sam", "frost"].filter(
  __1["default"]({ $regex: "^f", $options: "i", $nin: ["frank"] })
); // ["fred", "frost"]
[{ name: "frank" }, { name: "joe" }].filter(
  __1["default"]({ $where: "this.name === 'frank'" })
); // ["frank"]
[{ name: "frank" }, { name: "joe" }].filter(
  __1["default"]({
    $where: function() {
      return this.name === "frank";
    }
  })
); // ["frank"]
var bills = [
  {
    month: "july",
    casts: [
      {
        id: 1,
        value: 200
      },
      {
        id: 2,
        value: 1000
      }
    ]
  },
  {
    month: "august",
    casts: [
      {
        id: 3,
        value: 1000
      },
      {
        id: 4,
        value: 4000
      }
    ]
  }
];
var result = bills.filter(
  __1["default"]({
    casts: {
      $elemMatch: {
        value: { $gt: 1000 }
      }
    }
  })
); // {month:'august', casts:[{id:3, value: 1000},{id: 4, value: 4000}]}
[{ name: "frank" }, { name: "joe" }].filter(
  __1["default"]({
    $where: function() {
      return this.name === "frank";
    }
  })
);
["craig", "tim", "jake"].filter(
  __1["default"]({ $not: { $in: ["craig", "tim"] } })
); //['jake']
["craig", "tim", "jake"].filter(__1["default"]({ $not: { $size: 5 } })); //['tim','jake']
