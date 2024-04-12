import sift, { createQueryTester, $in, $or, $eq } from "..";
import { createQueryOperation, createOperationTester } from "../lib/core";

sift<any>({ $gt: 10 });
sift<string>({ $gt: "10" });
sift<Date>({ $gt: new Date(10) });
sift<{}>({ $gt: "10" });

sift({ $gte: 10 });
sift({ $gte: "10" });
sift({ $gte: new Date(10) });

sift({ $lt: 10 });
sift({ $lt: "10" });
sift({ $lt: new Date(10) });

sift({ $lte: 10 });
sift({ $lte: "10" });
sift({ $lte: new Date(10) });

type Person = {
  name: string;
  last: string;
  address: {
    zip?: number;
  };
  friends: Person[];
};

const demoFriend: Person = {
  name: "a",
  last: "b",
  address: {},
  friends: [],
};

sift<Person>({
  name: "a",
  last: { $eq: "a", $ne: "a", $in: ["a"], $nin: ["a"], $or: [{ $eq: "a" }] },
});

// fail
// sift<Person>({ name: 5, last: { $eq: "a" } });
sift<Person>({ name: "a", friends: { $elemMatch: { name: "first" } } });
sift<Person>({ name: "a", address: { zip: 55555 } });

// pass
sift<Person>({
  name: "a",
  $or: [{ name: "jeffery", last: "joe" }],
});

type PersonSchema = Person & {
  "address.zip": number;
};

sift<Person, PersonSchema>({ "address.zip": 4, name: "a" })(demoFriend);

type Test2 = {
  name: string | number;
};

sift<Test2>({ name: 5 });
sift<Test2>({
  name: { $gt: 10 },
  $where: () => {
    return true;
  },
});

// fail
// sift<Something>({ name: { $gt: new Date(10) } });
sift<Test2>({ name: { $gt: "5" } });

[{ string: "hello", number: 1 }].filter(
  sift({
    string: "a",
    number: 1,
  }),
);

const obj = {
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
    prop: true,
  },
  foo: {
    bar: {
      baz: 1,
      biz: 5,
    },
  },
};

[obj].filter(
  sift({
    number: {
      $in: [123, 2, 3], // Type '{ $in: number[]; }' is not assignable to type 'number | alueQuery<number>   undefined'. Object literal may only specify known properties, and '$in' does not exist in type 'ValueQuery<number>'.
    },
  }),
);

const a = [obj].some(
  sift<
    typeof obj,
    {
      "foo.bar.baz": number;
    } & typeof obj
  >({
    "foo.bar.baz": {
      $in: [1, 2, 3],
    },
    foo: {
      bar: {
        // $in: [1, 2, 3] should fail
        baz: 4,
        biz: 5,
      },
    },
  }),
); // returns false

[
  { tags: ["books", "programming", "travel"] },
  { tags: ["travel", "cooking"] },
].filter(sift({ tags: { $all: ["books", "programming"] } }));

["craig", "john", "jake"].filter(sift(/^j/));
["craig", "tim", "jake"].filter(sift({ $not: { $in: ["craig", "tim"] } }));

//intersecting arrays
const result1 = ["hello", "sifted", "array!"].filter(
  sift({ $in: ["hello", "world"] }),
); //['hello']

//regexp filter
const result2 = ["craig", "john", "jake"].filter(sift(/^j/)); //['john','jake']

// function filter
const testFilter = sift({
  //you can also filter against functions
  name: function (value) {
    return value.length == 5;
  },
});

[
  {
    name: "craig",
  },
  {
    name: "john",
  },
  {
    name: "jake",
  },
].filter(testFilter); // filtered: [{ name: 'craig' }]

//you can test *single values* against your custom sifter
testFilter({ name: "sarah" }); //true
testFilter({ name: "tim" }); //false
[3, 4, 5, 6, 7].filter(sift({ $exists: true })); // [6, 7]

createQueryTester({ $eq: 5 }, { operations: { $eq, $in } });

["Brazil", "Haiti", "Peru", "Chile"].filter(
  sift({ $in: ["Costa Rica", "Brazil"] }),
);

[{ name: "Craig", location: "Brazil" }].filter(
  sift({ location: { $in: ["Costa Rica", "Brazil"] } }),
);

["Brazil", "Haiti", "Peru", "Chile"].filter(
  sift({ $nin: ["Costa Rica", "Brazil"] }),
);

[{ name: "Craig", city: "Minneapolis" }, { name: "Tim" }].filter(
  sift({ city: { $exists: false } }),
);
[0, 1, 2, 3].filter(sift({ $gte: 2 }));

[0, 1, 2, 3].filter(sift({ $gt: 2 }));
[0, 1, 2, 3].filter(sift({ $lte: 2 }));
[0, 1, 2, 3].filter(sift({ $lt: 2 }));
[{ state: "MN" }, { state: "CA" }, { state: "WI" }].filter(
  sift({ state: { $eq: "MN" } }),
);
[{ state: "MN" }, { state: "CA" }, { state: "WI" }].filter(
  sift({ state: "MN" }),
);
[{ state: "MN" }, { state: "CA" }, { state: "WI" }].filter(
  sift({ state: { $ne: "MN" } }),
);
[100, 200, 300, 400, 500, 600].filter(sift({ $mod: [3, 0] }));
[
  { tags: ["books", "programming", "travel"] },
  { tags: ["travel", "cooking"] },
].filter(sift({ tags: { $all: ["books", "programming"] } }));

[
  { name: "Craig", state: "MN" },
  { name: "Tim", state: "MN" },
  { name: "Joe", state: "CA" },
].filter(sift({ $and: [{ name: "Craig" }, { state: "MN" }] }));

[
  { name: "Craig", state: "MN" },
  { name: "Tim", state: "MN" },
  { name: "Joe", state: "CA" },
].filter(sift({ $or: [{ name: "Craig" }, { state: "MN" }] }));

[
  { name: "Craig", state: "MN" },
  { name: "Tim", state: "MN" },
  { name: "Joe", state: "CA" },
].filter(sift({ $nor: [{ name: "Craig" }, { state: "MN" }] }));

[{ tags: ["food", "cooking"] }, { tags: ["traveling"] }].filter(
  sift({ tags: { $size: 2 } }),
);

[new Date(), 4342, "hello world"].filter(sift({ $type: Date })); //returns single date
[new Date(), 4342, "hello world"].filter(sift({ $type: String })); //returns ['hello world']

["frank", "fred", "sam", "frost"].filter(
  sift({ $regex: /^f/i, $nin: ["frank"] }),
); // ["fred", "frost"]
["frank", "fred", "sam", "frost"].filter(
  sift({ $regex: "^f", $options: "i", $nin: ["frank"] }),
); // ["fred", "frost"]

[{ name: "frank" }, { name: "joe" }].filter(
  sift({ $where: "this.name === 'frank'" }),
); // ["frank"]
[{ name: "frank" }, { name: "joe" }].filter(
  sift({
    $where: function () {
      return (this as any).name === "frank";
    },
  }),
); // ["frank"]

var bills = [
  {
    month: "july",
    casts: [
      {
        id: 1,
        value: 200,
      },
      {
        id: 2,
        value: 1000,
      },
    ],
  },
  {
    month: "august",
    casts: [
      {
        id: 3,
        value: 1000,
      },
      {
        id: 4,
        value: 4000,
      },
    ],
  },
];

var result = bills.filter(
  sift({
    casts: {
      $elemMatch: {
        value: { $gt: 1000 },
      },
    },
  }),
); // {month:'august', casts:[{id:3, value: 1000},{id: 4, value: 4000}]}

[{ name: "frank" }, { name: "joe", last: "bob" }].filter(
  sift({
    $where: function () {
      return (this as any).name === "frank" || (this as any).last === "bob";
    },
  }),
);

["craig", "tim", "jake"].filter(sift({ $not: { $in: ["craig", "tim"] } })); //['jake']
["craig", "tim", "jake"].filter(sift({ $not: { $size: 5 } })); //['tim','jake']

const o = createQueryOperation<Person>({ name: "a" });
const t = createOperationTester(o);
t(demoFriend);
