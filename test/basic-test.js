const assert = require("assert");
const _eval = require("eval");
const { default: sift, createQueryTester, $mod, $eq } = require("../lib");
const { ObjectId } = require("bson");

describe(__filename + "#", function () {
  it("doesn't sort arrays", function () {
    var values = [9, 8, 7, 6, 5, 4, 3, 2, 1].filter(
      sift({
        $or: [3, 2, 1],
      }),
    );

    assert.equal(values.length, 3);
    assert.equal(values[0], 3);
    assert.equal(values[1], 2);
    assert.equal(values[2], 1);
  });

  xit("can create a custom selector, and use it", function () {
    var sifter = sift(
      { age: { $gt: 5 } },
      {
        select: function (item) {
          return item.person;
        },
      },
    );

    var people = [{ person: { age: 6 } }],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0], people[0]);
  });

  it("can match empty arrays", function () {
    var statusQuery = {
      $or: [
        { status: { $exists: false } },
        { status: [] },
        { status: { $in: ["urgent", "completed", "today"] } },
      ],
    };

    var filtered = [
      { status: [] },
      { status: ["urgent"] },
      { status: ["nope"] },
    ].filter(sift(statusQuery));

    assert.equal(filtered.length, 2);
  });

  it("can compare various $lt dates", () => {
    assert.equal(sift({ $lt: new Date() })(new Date("2010-01-01")), true);
    assert.equal(sift({ $lt: new Date() })(new Date("2030-01-01")), false);
    assert.equal(sift({ $lt: new Date() })(null), false);
  });

  it("$ne: null does not hit when field is present", function () {
    var sifter = sift({ age: { $ne: null } });

    var people = [{ age: "matched" }, { missed: 1 }];
    var filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].age, "matched");
  });

  it("$ne does not hit when field is different", function () {
    var sifter = sift({ age: { $ne: 5 } });

    var people = [{ age: 5 }],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 0);
  });

  it("$ne does hit when field exists with different value", function () {
    var sifter = sift({ age: { $ne: 4 } });

    var people = [{ age: 5 }],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
  });

  it("$ne does hit when field does not exist", function () {
    var sifter = sift({ age: { $ne: 5 } });

    var people = [{}],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
  });

  it("$eq matches objects that serialize to the same value", function () {
    var counter = 0;
    function Book(name) {
      this.name = name;
      this.copyNumber = counter;
      this.toJSON = function () {
        return this.name; // discard the copy when serializing.
      };
      counter += 1;
    }

    var warAndPeace = new Book("War and Peace");

    var sifter = sift({ $eq: warAndPeace });

    var books = [new Book("War and Peace")];
    var filtered = books.filter(sifter);

    assert.equal(filtered.length, 1);
  });

  it("$neq does not match objects that serialize to the same value", function () {
    var counter = 0;
    function Book(name) {
      this.name = name;
      this.copyNumber = counter;
      this.toJSON = function () {
        return this.name; // discard the copy when serializing.
      };
      counter += 1;
    }

    var warAndPeace = new Book("War and Peace");

    var sifter = sift({ $ne: warAndPeace });

    var books = [new Book("War and Peace")];
    var filtered = books.filter(sifter);

    assert.equal(filtered.length, 0);
  });

  // https://gist.github.com/jdnichollsc/00ea8cf1204b17d9fb9a991fbd1dfee6
  it("returns a period between start and end dates", function () {
    var product = {
      productTypeCode: "productTypeEnergy",
      quantities: [
        {
          period: {
            startDate: new Date("2017-01-13T05:00:00.000Z"),
            endDate: new Date("2017-01-31T05:00:00.000Z"),
            dayType: {
              normal: true,
              holiday: true,
            },
            specificDays: ["monday", "wednesday", "friday"],
            loadType: {
              high: true,
              medium: false,
              low: false,
            },
          },
          type: "DemandPercentage",
          quantityValue: "44",
        },
        {
          period: {
            startDate: new Date("2017-01-13T05:00:00.000Z"),
            endDate: new Date("2017-01-31T05:00:00.000Z"),
            dayType: {
              normal: true,
              holiday: true,
            },
            loadType: {
              high: false,
              medium: true,
              low: false,
            },
          },
          type: "Value",
          quantityValue: "22",
        },
      ],
    };

    var period = {
      startDate: new Date("2017-01-08T05:00:00.000Z"),
      endDate: new Date("2017-01-29T05:00:00.000Z"),
      dayType: {
        normal: true,
        holiday: true,
      },
      loadType: {
        high: true,
        medium: false,
        low: true,
      },
      specificPeriods: ["3", "4", "5-10"],
    };

    var results = product.quantities.filter(
      sift({
        $and: [
          { "period.startDate": { $lte: period.endDate } },
          { "period.endDate": { $gte: period.startDate } },
        ],
      }),
    );

    assert.equal(results.length, 2);
  });

  it("works with new Function()", () => {
    const fn = new Function(
      "sift",
      `
      const sifter = sift({ a: 'a1' });
      const arr = [{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }];
      return arr.filter(sifter);
    `,
    );

    const results = fn(sift);
    assert.equal(results.length, 1);
  });

  it("works with eval (node sandbox)", () => {
    const code = `
      const sifter = sift({ a: 'a1' });
      const arr = [{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }];
      module.exports = arr.filter(sifter);
    `;

    const results = _eval(code, "filename", {
      sift,
      console: { log: console.log.bind(console) },
    });
    assert.equal(results.length, 1);
  });

  it("Can use a custom compare", () => {
    let calledCompareCount = 0;
    class Item {
      constructor(value) {
        this.value = value;
      }
      compare(other) {
        calledCompareCount++;
        return other && this.value === other.value;
      }
    }

    const filter = sift(new Item("a"), {
      compare(a, b) {
        return a.compare(b);
      },
    });

    const items = [new Item("a"), new Item("b"), new Item("a")];
    const results = items.filter(filter);
    assert.equal(results.length, 2);
    assert.equal(calledCompareCount, 3);
  });

  it("Works with Object ids", () => {
    const test1 = sift({
      $in: [
        new ObjectId("54dd5546b1d296a54d152e84"),
        new ObjectId("54dd5546b1d296a54d152e85"),
      ],
    });

    assert.equal(test1(new ObjectId("54dd5546b1d296a54d152e84")), true);
    assert.equal(test1(new ObjectId("54dd5546b1d296a54d152e85")), true);
    assert.equal(test1(new ObjectId("54dd5546b1d296a54d152e86")), false);
  });

  it("works with toJSON", () => {
    function ObjectId(value) {
      // primitive implementation
      return {
        toJSON: () => value,
      };
    }

    const test1 = sift({
      $in: [ObjectId("1"), ObjectId("2")],
    });

    const result = test1(ObjectId("1")); // expects to be true
    assert.equal(result, true);
  });

  it("Works if prop has toJSON", () => {
    function Creator(value) {
      // primitive implementation
      return {
        toJSON: () => value,
      };
    }

    const test1 = sift({
      creator: Creator("1"),
    });

    assert.equal(test1({ creator: Creator("1") }), true);
  });

  // https://github.com/crcn/sift.js/issues/159
  it("can sift with a regexp string", () => {
    let where = {
      $not: {
        value: {
          $regex: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,4}$",
        },
      },
    };
    const whereProps = {
      value: "funky@example.com",
    };

    const filtered = [whereProps].filter(sift(where));
    assert.equal(filtered.length, 0);
  });

  // --- ticket fixes go here ----

  it("passes #196", () => {
    const filter = {
      Demo: { $in: [null, [], "C"] },
    };

    const fun = sift(filter);

    assert.equal(fun({ Demo: ["A", "B"] }), false); // should be false but it return true
    assert.equal(fun({ Demo: null }), true); // true is ok
    assert.equal(fun({ Demo: [] }), true); // true is ok
    assert.equal(fun({ Demo: ["C"] }), true); // true is ok
  });

  it("properly resets $elemMatch", () => {
    const test = sift({
      groups: {
        $elemMatch: { id: 1, status: "review" },
      },
    });

    const items = [
      { groups: [{ id: 1, status: "review" }] },
      { groups: [{ id: 1, status: "done" }] },
    ];

    assert.equal(test(items[0]), true);
    assert.equal(test(items[1]), false);
  });

  it("passes for #211", () => {
    const values = [
      {
        name: "zeroElements",
        myArray: [],
      },

      {
        name: "oneElement",
        myArray: [{ firstKey: "a", secondKey: "b" }],
      },

      {
        name: "twoElements",
        myArray: [
          { firstKey: "a", secondKey: "b" },
          { firstKey: "c", secondKey: "d" },
        ],
      },

      {
        name: "otherElement",
        myArray: [{ firstKey: "e", secondKey: "f" }],
      },
    ];

    const query1 = {
      myArray: {
        $elemMatch: { firstKey: "a", secondKey: "b" },
      },
    };

    const test = sift(query1);

    assert.equal(test(values[1]), true);
    assert.equal(test(values[3]), false);
    assert.equal(test(values[2]), true);
  });

  it("Throws an error if $ is nested in $in", () => {
    const filter = {
      Demo: { $in: [{ $eq: 1 }] },
    };

    let err;
    try {
      const fun = sift(filter);
    } catch (e) {
      err = e;
    }

    assert.equal(err.message, "cannot nest $ under $in");
  });

  it("Throws an error if $ is nested in $nin", () => {
    const filter = {
      Demo: { $nin: [{ $eq: 1 }] },
    };

    let err;
    try {
      const fun = sift(filter);
    } catch (e) {
      err = e;
    }

    assert.equal(err.message, "cannot nest $ under $nin");
  });

  // https://github.com/crcn/sift.js/issues/200
  it("works with RegExp with global flag", () => {
    const objects = [
      {
        prop1: "asdf",
        prop2: "as",
      },
      {
        prop1: "asdf 1234",
        prop2: "as",
      },
      {
        prop1: "asdf qwer",
        prop2: "as",
      },
    ];

    const resultsWithGlobal = objects.filter(
      sift({
        prop1: /.*?(as|df).*?/g,
        prop2: "as",
      }),
    );

    const resultsWithoutGlobal = objects.filter(
      sift({
        prop1: /.*?(as|df).*?/,
        prop2: "as",
      }),
    );

    const resultsWithGlobal2 = objects.filter(
      sift({
        prop1: { $regex: ".*?(as|df).*?", $options: "g" },
        prop2: "as",
      }),
    );

    const resultsWithoutGlobal2 = objects.filter(
      sift({
        prop1: { $regex: ".*?(as|df).*?" },
        prop2: "as",
      }),
    );

    assert.equal(resultsWithGlobal.length, 3);
    assert.equal(resultsWithoutGlobal.length, 3);

    assert.equal(resultsWithGlobal2.length, 3);
    assert.equal(resultsWithoutGlobal2.length, 3);
  });

  // fixes #214
  it("$elemMatch and $size work", () => {
    const values = [
      {
        name: "oneElement",
        myArray: [{ firstKey: "a", secondKey: "b" }],
      },

      {
        name: "twoElements",
        myArray: [
          { firstKey: "a", secondKey: "b" },
          { firstKey: "c", secondKey: "d" },
        ],
      },
    ];

    const query = {
      myArray: {
        $elemMatch: { firstKey: "a", secondKey: "b" },
        $size: 1,
      },
    };

    const result = values.filter(sift(query));

    assert.equal(result[0], values[0]);
  });

  it("should not handle $elemMatch with string value", () => {
    assert.throws(() => {
      assert.equal(
        sift({ responsible: { $elemMatch: "Poyan" } })({
          responsible: ["Poyan", "Marcus"],
        }),
        false,
      );
    }, new Error("Malformed query. $elemMatch must by an object."));
  });

  it("$or in prop doesn't work", () => {
    assert.throws(() => {
      sift({
        responsible: { $or: [{ name: "Poyan" }, { name: "Marcus" }] },
      })({ responsible: { name: "Poyan" } });
    }, new Error("Malformed query. $or cannot be matched against property."));
  });

  it("can register an operation without $", () => {
    const filter = createQueryTester({ eq: 2 }, { operations: { eq: $eq } });

    assert.equal(filter(2), true);
  });

  it("Throws error if operations are mixed with props", () => {
    assert.throws(() => {
      createQueryTester(
        { name: { eq: 5, prop: 100 } },
        { operations: { eq: $eq } },
      );
    }, new Error("Property queries must contain only operations, or exact objects."));
  });

  it("Throws error if operations are mixed with props", () => {
    sift({ _id: { $in: [new ObjectId("610b6bc9e29dbd1bb5f045bf")] } });

    const test = sift({
      _id: { $in: [new ObjectId("610b6bc9e29dbd1bb5f045bf")] },
    });
    assert.equal(test({ _id: new ObjectId("610b6bc9e29dbd1bb5f045bf") }), true);
  });

  // fix https://github.com/crcn/sift.js/issues/239
  it("Throws an error if an operation is not found", () => {
    assert.throws(() => {
      sift({
        _id: { $notFound: "blah" },
      });
    }, new Error("Unsupported operation: $notFound"));
  });

  it("Empty $or/$and/$nor throws error if empty", () => {
    assert.throws(() => {
      sift({ $or: [] });
    }, new Error("$and/$or/$nor must be a nonempty array"));
    assert.throws(() => {
      sift({ $and: [] });
    }, new Error("$and/$or/$nor must be a nonempty array"));
    assert.throws(() => {
      sift({ $nor: [] });
    }, new Error("$and/$or/$nor must be a nonempty array"));
  });

  it(`supports implicit $and`, () => {
    const result = [
      {
        tags: ["animal", "dog"],
      },
      {
        tags: ["animal", "cat"],
      },
      {
        tags: ["animal", "mouse"],
      },
    ].filter(
      sift({
        tags: {
          $in: ["animal"],
          $nin: ["mouse"],
        },
      }),
    );

    assert.deepEqual(result, [
      {
        tags: ["animal", "dog"],
      },
      {
        tags: ["animal", "cat"],
      },
    ]);
  });

  // https://github.com/crcn/sift.js/issues/273
  it("$exists and $ne work on paths through arrays", () => {
    const doc = {
      _id: "6800f65219603a837cf2ba70",
      companies: [
        {
          monthlySpend: 100,
          customFields: { subscriptionStatus: "paid" },
        },
      ],
      organizationId: "5febde12dc56d60012d47db6",
    };

    assert.equal(
      sift({
        _id: "6800f65219603a837cf2ba70",
        "companies.monthlySpend": { $exists: true, $ne: null },
        organizationId: "5febde12dc56d60012d47db6",
      })(doc),
      true,
    );
    assert.equal(sift({ "companies.monthlySpend": { $ne: null } })(doc), true);
    assert.equal(
      sift({ "companies.monthlySpend": { $exists: false } })(doc),
      false,
    );
    assert.equal(sift({ "companies.missing": { $exists: false } })(doc), true);
    assert.equal(sift({ "companies.missing": { $ne: null } })(doc), false);
  });

  it("$exists checks every array element", () => {
    const doc = { a: [null, { b: 1 }] };
    assert.equal(sift({ "a.b": { $exists: true } })(doc), true);
    assert.equal(sift({ "a.b": { $exists: false } })(doc), false);
    assert.equal(sift({ "a.b": { $exists: false } })({ a: [] }), true);
    assert.equal(sift({ "a.b": { $exists: true } })({ a: [] }), false);
    assert.equal(
      sift({ "a.b.c": { $not: { $exists: false } } })({ a: [null] }),
      false,
    );
    assert.equal(
      sift({ "a.b.c": { $not: { $exists: true } } })({ a: null }),
      true,
    );
  });

  it("$nin checks every array element", () => {
    const doc = { a: [{ b: 1 }, { b: 2 }] };
    assert.equal(sift({ "a.b": { $nin: [2] } })(doc), false);
    assert.equal(sift({ "a.b": { $nin: [3] } })(doc), true);
    assert.equal(
      sift({ "a.b": { $nin: [null] } })({ a: [{ b: 1 }, {}] }),
      false,
    );
  });

  it("$in/$nin [null] agree with $eq/$ne null on paths through arrays", () => {
    const docs = [
      { a: [{ b: 1 }] },
      { a: [{ b: null }] },
      { a: [{}] },
      { a: [] },
    ];
    const matches = (query) => docs.map((doc) => sift(query)(doc));
    assert.deepEqual(
      matches({ "a.b": { $in: [null] } }),
      matches({ "a.b": null }),
    );
    assert.deepEqual(
      matches({ "a.b": { $nin: [null] } }),
      matches({ "a.b": { $ne: null } }),
    );
    assert.deepEqual(matches({ "a.b": { $ne: null } }), [
      true,
      false,
      false,
      true,
    ]);
  });

  it("$ne/$in/$nin see getters on Array subclasses", () => {
    class Things extends Array {
      get count() {
        return this.length;
      }
      get first() {
        return this[0];
      }
    }
    const doc = { things: Things.from([{ id: 1 }, { id: 2 }]) };
    assert.equal(sift({ "things.count": { $in: [2] } })(doc), true);
    assert.equal(sift({ "things.count": { $ne: 2 } })(doc), false);
    assert.equal(sift({ "things.count": { $nin: [2] } })(doc), false);
    assert.equal(sift({ "things.first": { $ne: { id: 1 } } })(doc), false);
  });

  it("$ne: null on a missing array index", () => {
    assert.equal(sift({ "a.1": { $ne: null } })({ a: [{ b: 1 }] }), false);
  });

  it("$exists works when the tester is called on a value", () => {
    assert.equal(sift({ $exists: true })(5), true);
    assert.equal(sift({ $exists: true })(undefined), false);
    assert.equal(sift({ $exists: false })(5), false);
  });

  it("$not tracks intermediate nulls through $and/$or/$nor/$all", () => {
    for (const query of [
      { $and: [{ $exists: true }] },
      { $or: [{ $exists: true }] },
      { $nor: [{ $exists: false }] },
      { $all: [{ $exists: true }] },
    ]) {
      const test = sift({ "a.b": { $not: query } });
      assert.equal(test({ a: null }), true, JSON.stringify(query));
      assert.equal(test({ a: { b: 1 } }), false, JSON.stringify(query));
    }
  });

  // MongoDB checks every array on the path, e.g. each a[i].b for "a.b"
  it("$elemMatch checks every candidate array", () => {
    const doc = { a: [{ b: [{ c: 1 }] }, { b: [{ c: 0 }] }] };
    assert.equal(sift({ "a.b": { $elemMatch: { c: 0 } } })(doc), true);
    assert.equal(sift({ "a.b": { $elemMatch: { c: 2 } } })(doc), false);
    assert.equal(
      sift({ "a.b": { $elemMatch: { c: 0 } } })({
        a: [{ b: [{ c: 1 }] }, { b: [{ c: 2 }] }, { b: [{ c: 0 }] }],
      }),
      true,
    );
    assert.equal(
      sift({ "a.b": { $all: [{ $elemMatch: { c: 0 } }] } })(doc),
      true,
    );
    assert.equal(
      sift({ "a.b": { $not: { $elemMatch: { c: 0 } } } })(doc),
      false,
    );
    assert.equal(
      sift({ "a.b": { $elemMatch: { $gt: 4 } } })({
        a: [{ b: [1] }, { b: [5] }],
      }),
      true,
    );
  });

  it("$elemMatch on nested arrays and at the root is unchanged", () => {
    // MongoDB agrees: elements that are arrays aren't searched inside
    assert.equal(
      sift({ a: { $elemMatch: { $eq: 5 } } })({ a: [[1], [5]] }),
      false,
    );
    // MongoDB matches this one (the element equals [3, 4]); 17.x doesn't, and
    // this fix leaves it alone
    assert.equal(
      sift({ a: { $elemMatch: { $eq: [3, 4] } } })({
        a: [
          [1, 2],
          [3, 4],
        ],
      }),
      false,
    );
    assert.deepEqual(
      [[{ c: 0 }], [{ c: 1 }]].filter(sift({ $elemMatch: { c: 0 } })),
      [[{ c: 0 }]],
    );
    assert.equal(sift({ $elemMatch: { c: 0 } })([{ c: 1 }, { c: 0 }]), true);
  });

  // https://github.com/crcn/sift.js/issues/274
  it("customizes equality everywhere with the compare option", () => {
    const eqOverride = (value, param) =>
      String(value).toLowerCase() === String(param).toLowerCase();
    // compare(queryValue, itemValue)
    const options = { compare: (param, value) => eqOverride(value, param) };
    const doc = { name: "CRAIG", tags: ["A", "b"], friends: [{ name: "TIM" }] };
    for (const query of [
      { name: "craig" },
      { name: { $eq: "craig" } },
      { name: { $in: ["craig"] } },
      { name: { $ne: "tim" } },
      { name: { $nin: ["tim"] } },
      { tags: "a" },
      { tags: { $all: ["a", "B"] } },
      { friends: { $elemMatch: { name: "tim" } } },
      { "friends.name": "tim" },
      { $or: [{ name: "craig" }] },
      { name: { $not: { $eq: "tim" } } },
    ]) {
      assert.equal(sift(query, options)(doc), true, JSON.stringify(query));
    }
    assert.equal(sift({ name: { $ne: "craig" } }, options)(doc), false);
    assert.equal(sift({ name: { $nin: ["craig"] } }, options)(doc), false);
  });

  it("a custom $eq operation only overrides the $eq operator", () => {
    const { createEqualsOperation } = require("../lib");
    let calls = 0;
    const operations = {
      $eq: (params, ownerQuery, options) =>
        createEqualsOperation(
          (value) => (calls++, value === params),
          ownerQuery,
          options,
        ),
    };
    sift({ name: "craig" }, { operations })({ name: "craig" });
    assert.equal(calls, 0);
    sift({ name: { $eq: "craig" } }, { operations })({ name: "craig" });
    assert.equal(calls, 1);
  });

  // https://github.com/crcn/sift.js/issues/272
  it("supports string $where where `process` isn't defined", () => {
    const vm = require("vm");
    const fs = require("fs");
    const path = require("path");
    const load = (file) => {
      const context = vm.createContext({});
      vm.runInContext(
        fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
        context,
      );
      return context.sift.default;
    };
    const items = [{ a: 1 }, { a: 2 }];

    assert.equal(
      items.filter(load("lib/index.js")({ $where: "this.a === 1" })).length,
      1,
    );

    // the CSP build still rejects strings
    assert.throws(
      () => load("sift.csp.min.js")({ $where: "this.a === 1" }),
      /CSP mode/,
    );
  });

  // https://github.com/crcn/sift.js/issues/276
  it("ignores inherited $options and type aliases", () => {
    Object.prototype.$options = "invalid";
    try {
      assert.equal(sift({ $regex: "a" })("a"), true);
    } finally {
      delete Object.prototype.$options;
    }

    assert.throws(
      () => sift({ $type: "constructor" })(1),
      new Error("Type alias does not exist"),
    );
  });

  it("ignores a polluted Object.prototype.compare, operations or toJSON", () => {
    for (const [key, value] of [
      ["compare", "not a function"],
      ["operations", "x"],
      ["operations", ["x"]],
      ["toJSON", "x"],
    ]) {
      Object.prototype[key] = value;
      try {
        const label = `Object.prototype.${key} = ${JSON.stringify(value)}`;
        assert.equal(sift({ a: 1 })({ a: 1 }), true, label);
        assert.equal(sift({ a: [1] })({ a: [1] }), true, label);
        assert.equal(sift({ a: { $gt: 1 } })({ a: 2 }), true, label);
        assert.equal(sift({ a: { $in: [1, 2] } })({ a: 3 }), false, label);
        assert.equal(createQueryTester({ a: 1 })({ a: 1 }), true, label);
      } finally {
        delete Object.prototype[key];
      }
    }
  });

  it("can turn off string $where (README recipe)", () => {
    const { $where } = require("../lib");
    const safeSift = (query) =>
      sift(query, {
        operations: {
          $where(params, ownerQuery, options) {
            if (typeof params !== "function") {
              throw new Error("$where must be a function");
            }
            return $where(params, ownerQuery, options);
          },
        },
      });

    assert.throws(() => safeSift({ $where: "true" }), /must be a function/);
    assert.throws(
      () => safeSift({ a: { $elemMatch: { $where: "true" } } }),
      /must be a function/,
    );
    const isOne = function () {
      return this.a === 1;
    };
    assert.deepEqual([{ a: 1 }, { a: 2 }].filter(safeSift({ $where: isOne })), [
      { a: 1 },
    ]);
  });

  it("reads options and toJSON defined by a class", () => {
    class CaseInsensitive {
      compare(a, b) {
        return String(a).toLowerCase() === String(b).toLowerCase();
      }
    }
    assert.equal(
      sift({ name: "CRAIG" }, new CaseInsensitive())({ name: "craig" }),
      true,
    );

    class Id {
      constructor(value) {
        this.value = value;
      }
      toJSON() {
        return this.value;
      }
    }
    assert.equal(sift({ id: new Id("1") })({ id: new Id("1") }), true);
    assert.equal(sift({ id: new Id("1") })({ id: new Id("2") }), false);
  });
});
