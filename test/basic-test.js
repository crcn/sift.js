const assert = require("assert");
const _eval = require("eval");
const { default: sift } = require("..");
const { ObjectID } = require("bson");

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

  it("throws an error if the operation is invalid", function() {
    var err;
    try {
      sift({ $aaa: 1 })("b");
    } catch (e) {
      err = e;
    }

    assert.equal(err.message, "Unsupported operation: $aaa");
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
        new ObjectID("54dd5546b1d296a54d152e84"),
        new ObjectID("54dd5546b1d296a54d152e85")
      ]
    });

    assert.equal(test1(new ObjectID("54dd5546b1d296a54d152e84")), true);
    assert.equal(test1(new ObjectID("54dd5546b1d296a54d152e85")), true);
    assert.equal(test1(new ObjectID("54dd5546b1d296a54d152e86")), false);
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
});
