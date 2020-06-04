import sift from "..";

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

sift<Person>({
  name: "a",
  last: { $eq: "a", $ne: "a", $in: ["a"], $nin: ["a"], $or: [{ $eq: "a" }] }
});

// fail
// sift<Person>({ name: 5, last: { $eq: "a" } });
sift<Person>({ name: "a", friends: { $elemMatch: { name: "first" } } });
sift<Person>({ name: "a", address: { zip: 55555 } });

// pass
sift<Person>({
  name: "a",
  $or: [{ name: "jeffery", last: "joe" }]
});

type PersonSchema = Person & {
  "address.zip": number;
};

sift<Person, PersonSchema>({ "address.zip": 4, name: "a" });

type Test2 = {
  name: string | number;
};

sift<Test2>({ name: 5 });
sift<Test2>({ name: { $gt: 10 }, $where: () => {} });

// fail
// sift<Something>({ name: { $gt: new Date(10) } });
sift<Test2>({ name: { $gt: "5" } });

[{ string: "hello", number: 1 }].filter(
  sift({
    string: "a",
    number: 1
  })
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
  sift({
    number: {
      $in: [123, 2, 3] // Type '{ $in: number[]; }' is not assignable to type 'number | alueQuery<number>   undefined'. Object literal may only specify known properties, and '$in' does not exist in type 'ValueQuery<number>'.
    }
  })
);

const a = [obj].some(
  sift<
    typeof obj,
    {
      "foo.bar.baz": number;
    } & typeof obj
  >({
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
].filter(sift({ tags: { $all: ["books", "programming"] } }));
