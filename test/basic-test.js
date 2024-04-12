const assert = require("assert");
const _eval = require("eval");
const { default: sift, createQueryTester, $mod, $eq } = require("../lib");
const { ObjectId } = require("bson");

describe(__filename + "#", function() {
  it("doesn't sort arrays", function() {
    var values = [9, 8, 7, 6, 5, 4, 3, 2, 1].filter(
      sift({
        $or: [3, 2, 1]
      })
    );

    assert.equal(values.length, 3);
    assert.equal(values[0], 3);
    assert.equal(values[1], 2);
    assert.equal(values[2], 1);
  });

  xit("can create a custom selector, and use it", function() {
    var sifter = sift(
      { age: { $gt: 5 } },
      {
        select: function(item) {
          return item.person;
        }
      }
    );

    var people = [{ person: { age: 6 } }],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0], people[0]);
  });

  it("can match empty arrays", function() {
    var statusQuery = {
      $or: [
        { status: { $exists: false } },
        { status: [] },
        { status: { $in: ["urgent", "completed", "today"] } }
      ]
    };

    var filtered = [
      { status: [] },
      { status: ["urgent"] },
      { status: ["nope"] }
    ].filter(sift(statusQuery));

    assert.equal(filtered.length, 2);
  });

  it("can compare various $lt dates", () => {
    assert.equal(sift({ $lt: new Date() })(new Date("2010-01-01")), true);
    assert.equal(sift({ $lt: new Date() })(new Date("2030-01-01")), false);
    assert.equal(sift({ $lt: new Date() })(null), false);
  });

  it("$ne: null does not hit when field is present", function() {
    var sifter = sift({ age: { $ne: null } });

    var people = [{ age: "matched" }, { missed: 1 }];
    var filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].age, "matched");
  });

  it("$ne does not hit when field is different", function() {
    var sifter = sift({ age: { $ne: 5 } });

    var people = [{ age: 5 }],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 0);
  });

  it("$ne does hit when field exists with different value", function() {
    var sifter = sift({ age: { $ne: 4 } });

    var people = [{ age: 5 }],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
  });

  it("$ne does hit when field does not exist", function() {
    var sifter = sift({ age: { $ne: 5 } });

    var people = [{}],
      filtered = people.filter(sifter);

    assert.equal(filtered.length, 1);
  });

  it("$eq matches objects that serialize to the same value", function() {
    var counter = 0;
    function Book(name) {
      this.name = name;
      this.copyNumber = counter;
      this.toJSON = function() {
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

  it("$neq does not match objects that serialize to the same value", function() {
    var counter = 0;
    function Book(name) {
      this.name = name;
      this.copyNumber = counter;
      this.toJSON = function() {
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
  it("returns a period between start and end dates", function() {
    var product = {
      productTypeCode: "productTypeEnergy",
      quantities: [
        {
          period: {
            startDate: new Date("2017-01-13T05:00:00.000Z"),
            endDate: new Date("2017-01-31T05:00:00.000Z"),
            dayType: {
              normal: true,
              holiday: true
            },
            specificDays: ["monday", "wednesday", "friday"],
            loadType: {
              high: true,
              medium: false,
              low: false
            }
          },
          type: "DemandPercentage",
          quantityValue: "44"
        },
        {
          period: {
            startDate: new Date("2017-01-13T05:00:00.000Z"),
            endDate: new Date("2017-01-31T05:00:00.000Z"),
            dayType: {
              normal: true,
              holiday: true
            },
            loadType: {
              high: false,
              medium: true,
              low: false
            }
          },
          type: "Value",
          quantityValue: "22"
        }
      ]
    };

    var period = {
      startDate: new Date("2017-01-08T05:00:00.000Z"),
      endDate: new Date("2017-01-29T05:00:00.000Z"),
      dayType: {
        normal: true,
        holiday: true
      },
      loadType: {
        high: true,
        medium: false,
        low: true
      },
      specificPeriods: ["3", "4", "5-10"]
    };

    var results = product.quantities.filter(
      sift({
        $and: [
          { "period.startDate": { $lte: period.endDate } },
          { "period.endDate": { $gte: period.startDate } }
        ]
      })
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
    `
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
      console: { log: console.log.bind(console) }
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
      }
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
        new ObjectId("54dd5546b1d296a54d152e85")
      ]
    });

    assert.equal(test1(new ObjectId("54dd5546b1d296a54d152e84")), true);
    assert.equal(test1(new ObjectId("54dd5546b1d296a54d152e85")), true);
    assert.equal(test1(new ObjectId("54dd5546b1d296a54d152e86")), false);
  });

  it("works with toJSON", () => {
    function ObjectId(value) {
      // primitive implementation
      return {
        toJSON: () => value
      };
    }

    const test1 = sift({
      $in: [ObjectId("1"), ObjectId("2")]
    });

    const result = test1(ObjectId("1")); // expects to be true
    assert.equal(result, true);
  });

  it("Works if prop has toJSON", () => {
    function Creator(value) {
      // primitive implementation
      return {
        toJSON: () => value
      };
    }

    const test1 = sift({
      creator: Creator("1")
    });

    assert.equal(test1({ creator: Creator("1") }), true);
  });

  // https://github.com/crcn/sift.js/issues/159
  it("can sift with a regexp string", () => {
    let where = {
      $not: {
        value: {
          $regex: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,4}$"
        }
      }
    };
    const whereProps = {
      value: "funky@example.com"
    };

    const filtered = [whereProps].filter(sift(where));
    assert.equal(filtered.length, 0);
  });

  // --- ticket fixes go here ----

  it("passes #196", () => {
    const filter = {
      Demo: { $in: [null, [], "C"] }
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
        $elemMatch: { id: 1, status: "review" }
      }
    });

    const items = [
      { groups: [{ id: 1, status: "review" }] },
      { groups: [{ id: 1, status: "done" }] }
    ];

    assert.equal(test(items[0]), true);
    assert.equal(test(items[1]), false);
  });

  it("passes for #211", () => {
    const values = [
      {
        name: "zeroElements",
        myArray: []
      },

      {
        name: "oneElement",
        myArray: [{ firstKey: "a", secondKey: "b" }]
      },

      {
        name: "twoElements",
        myArray: [
          { firstKey: "a", secondKey: "b" },
          { firstKey: "c", secondKey: "d" }
        ]
      },

      {
        name: "otherElement",
        myArray: [{ firstKey: "e", secondKey: "f" }]
      }
    ];

    const query1 = {
      myArray: {
        $elemMatch: { firstKey: "a", secondKey: "b" }
      }
    };

    const test = sift(query1);

    assert.equal(test(values[1]), true);
    assert.equal(test(values[3]), false);
    assert.equal(test(values[2]), true);
  });

  it("Throws an error if $ is nested in $in", () => {
    const filter = {
      Demo: { $in: [{ $eq: 1 }] }
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
      Demo: { $nin: [{ $eq: 1 }] }
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
        prop2: "as"
      },
      {
        prop1: "asdf 1234",
        prop2: "as"
      },
      {
        prop1: "asdf qwer",
        prop2: "as"
      }
    ];

    const resultsWithGlobal = objects.filter(
      sift({
        prop1: /.*?(as|df).*?/g,
        prop2: "as"
      })
    );

    const resultsWithoutGlobal = objects.filter(
      sift({
        prop1: /.*?(as|df).*?/,
        prop2: "as"
      })
    );

    const resultsWithGlobal2 = objects.filter(
      sift({
        prop1: { $regex: ".*?(as|df).*?", $options: "g" },
        prop2: "as"
      })
    );

    const resultsWithoutGlobal2 = objects.filter(
      sift({
        prop1: { $regex: ".*?(as|df).*?" },
        prop2: "as"
      })
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
        myArray: [{ firstKey: "a", secondKey: "b" }]
      },

      {
        name: "twoElements",
        myArray: [
          { firstKey: "a", secondKey: "b" },
          { firstKey: "c", secondKey: "d" }
        ]
      }
    ];

    const query = {
      myArray: {
        $elemMatch: { firstKey: "a", secondKey: "b" },
        $size: 1
      }
    };

    const result = values.filter(sift(query));

    assert.equal(result[0], values[0]);
  });

  it("should not handle $elemMatch with string value", () => {
    assert.throws(() => {
      assert.equal(
        sift({ responsible: { $elemMatch: "Poyan" } })({
          responsible: ["Poyan", "Marcus"]
        }),
        false
      );
    }, new Error("Malformed query. $elemMatch must by an object."));
  });

  it("$or in prop doesn't work", () => {
    assert.throws(() => {
      sift({
        responsible: { $or: [{ name: "Poyan" }, { name: "Marcus" }] }
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
        { operations: { eq: $eq } }
      );
    }, new Error("Property queries must contain only operations, or exact objects."));
  });

  it("Throws error if operations are mixed with props", () => {
    sift({ _id: { $in: [new ObjectId("610b6bc9e29dbd1bb5f045bf")] } });

    const test = sift({
      _id: { $in: [new ObjectId("610b6bc9e29dbd1bb5f045bf")] }
    });
    assert.equal(test({ _id: new ObjectId("610b6bc9e29dbd1bb5f045bf") }), true);
  });

  // fix https://github.com/crcn/sift.js/issues/239
  it("Throws an error if an operation is not found", () => {
    assert.throws(() => {
      sift({
        _id: { $notFound: "blah" }
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
        tags: ["animal", "dog"]
      },
      {
        tags: ["animal", "cat"]
      },
      {
        tags: ["animal", "mouse"]
      }
    ].filter(
      sift({
        tags: {
          $in: ["animal"],
          $nin: ["mouse"]
        }
      })
    );

    assert.deepEqual(result, [
      {
        tags: ["animal", "dog"]
      },
      {
        tags: ["animal", "cat"]
      }
    ]);
  });
});
