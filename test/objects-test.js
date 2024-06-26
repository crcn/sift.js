const assert = require("assert");
const { default: sift } = require("../lib");

describe(__filename + "#", function () {
  var topic = [
    {
      name: "craig",
      age: 90001,
      tags: ["coder", "programmer", "traveler", "photographer"],
      address: {
        city: "Minneapolis",
        state: "MN",
        phone: "9999999999",
      },
      tags: ["photos", "cook"],
      hobbies: [
        {
          name: "programming",
          description: "some desc",
        },
        {
          name: "cooking",
        },
        {
          name: "photography",
          places: ["haiti", "brazil", "costa rica"],
        },
        {
          name: "backpacking",
        },
      ],
    },
    {
      name: "tim",
      age: 90001,
      tags: ["traveler", "photographer"],
      address: {
        city: "St. Paul",
        state: "MN",
        phone: "765765756765",
      },
      tags: ["dj"],
      hobbies: [
        {
          name: "biking",
          description: "some desc",
        },
        {
          name: "DJ",
        },
        {
          name: "photography",
          places: ["costa rica"],
        },
      ],
    },
  ];

  xit("has sifted through photography in brazil count of 1", function () {
    var sifted = topic.filter(
      sift({
        hobbies: {
          name: "photography",
          places: {
            $in: ["brazil"],
          },
        },
      }),
    );
    assert.equal(sifted.length, 1);
  });
  xit("has sifted through photography in brazil, haiti, and costa rica count of 1", function () {
    var sifted = topic.filter(
      sift({
        hobbies: {
          name: "photography",
          places: {
            $all: ["brazil", "haiti", "costa rica"],
          },
        },
      }),
    );
    assert.equal(sifted.length, 1);
    assert.equal(sifted[0], topic[0]);
  });
  xit("has a sifted hobbies of photography, cooking, or biking count of 2", function () {
    var sifted = topic.filter(
      sift({
        hobbies: {
          name: {
            $in: ["photography", "cooking", "biking"],
          },
        },
      }),
    );
    assert.equal(sifted.length, 2);
  });
  xit("has sifted to complex count of 2", function () {
    var sifted = topic.filter(
      sift({
        hobbies: {
          name: "photography",
          places: {
            $in: ["costa rica"],
          },
        },
        address: {
          state: "MN",
          phone: {
            $exists: true,
          },
        },
      }),
    );

    assert.equal(sifted.length, 2);
  });
  xit("has sifted to complex count of 0", function () {
    var sifted = topic.filter(
      sift({
        hobbies: {
          name: "photos",
          places: {
            $in: ["costa rica"],
          },
        },
      }),
    );
    assert.equal(sifted.length, 0);
  });
  xit("has sifted subobject hobbies count of 3", function () {
    var sifted = topic.filter(
      sift({
        "hobbies.name": "photography",
      }),
    );
    assert.equal(sifted.length, 2);
  });
  it("has sifted dot-notation hobbies of photography, cooking, and biking count of 3", function () {
    var sifted = topic.filter(
      sift({
        "hobbies.name": {
          $in: ["photography", "cooking", "biking"],
        },
      }),
    );
    assert.equal(sifted.length, 2);
  });
  it("has sifted to complex dot-search count of 2", function () {
    var sifted = topic.filter(
      sift({
        "hobbies.name": "photography",
        "hobbies.places": {
          $in: ["costa rica"],
        },
        "address.state": "MN",
        "address.phone": {
          $exists: true,
        },
      }),
    );
    assert.equal(sifted.length, 2);
  });
  xit("has sifted with selector function count of 2", function () {
    var sifted = topic.filter(
      sift(
        {
          name: "photography",
          places: {
            $in: ["costa rica"],
          },
        },
        {
          select: function (item) {
            return item.hobbies;
          },
        },
      ),
    );
    assert.equal(sifted.length, 2);
  });

  describe("nesting", function () {
    it("$eq for nested object", function () {
      var sifted = loremArr.filter(sift({ "sub.num": { $eq: 10 } }));
      assert(sifted.length > 0);
      sifted.forEach(function (v) {
        assert.equal(10, v.sub.num);
      });
    });

    it("$ne for nested object", function () {
      var sifted = loremArr.filter(sift({ "sub.num": { $ne: 10 } }));
      assert(sifted.length > 0);
      sifted.forEach(function (v) {
        assert.notEqual(10, v.sub.num);
      });
    });

    it("$regex for nested object (one missing key)", function () {
      var persons = [
        {
          id: 1,
          prof: "Mr. Moriarty",
        },
        {
          id: 2,
          prof: "Mycroft Holmes",
        },
        {
          id: 3,
          name: "Dr. Watson",
          prof: "Doctor",
        },
        {
          id: 4,
          name: "Mr. Holmes",
          prof: "Detective",
        },
      ];
      var q = { name: { $regex: "n" } };
      var sifted = persons.filter(sift(q));
      assert.deepEqual(sifted, [
        {
          id: 3,
          name: "Dr. Watson",
          prof: "Doctor",
        },
      ]);
    });
  });

  describe("arrays of objects", function () {
    var objects = [
      {
        things: [
          {
            id: 123,
          },
          {
            id: 456,
          },
        ],
      },
      {
        things: [
          {
            id: 123,
          },
          {
            id: 789,
          },
        ],
      },
    ];

    it("$eq for array of objects, matches if at least one exists", function () {
      let q = {
        "things.id": 123,
      };
      var sifted = objects.filter(sift(q));
      assert.deepEqual(sifted, objects);
      let q2 = {
        "things.id": 789,
      };
      var sifted2 = objects.filter(sift(q2));
      assert.deepEqual(sifted2, [objects[1]]);
    });

    it("$ne for array of objects, returns if none of the array elements match the query", function () {
      let q = {
        "things.id": {
          $ne: 123,
        },
      };
      var sifted = objects.filter(sift(q));
      assert.deepEqual(sifted, []);
      let q2 = {
        "things.id": {
          $ne: 789,
        },
      };
      var sifted2 = objects.filter(sift(q2));
      assert.deepEqual(sifted2, [objects[0]]);
    });

    it("$eq for array of objects, that have properties in addition to indices", function () {
      class ArrayWithGetters extends Array {
        get first() {
          return this.at(0);
        }
        get last() {
          return this.at(-1);
        }
      }

      let objects = [
        {
          things: new ArrayWithGetters({ id: 123 }, { id: 456 }),
        },
        {
          things: new ArrayWithGetters({ id: 123 }, { id: 789 }),
        },
      ];

      let q = {
        "things.first.id": 123,
      };
      let sifted = objects.filter(sift(q));
      assert.deepEqual(sifted, objects);

      let q2 = {
        "things.last.id": 789,
      };
      let sifted2 = objects.filter(sift(q2));
      assert.deepEqual(sifted2, [objects[1]]);

      objects = [
        { things: new ArrayWithGetters({ map: "USA" }, { map: "DEU" }) },
        { things: new ArrayWithGetters({ map: "USA" }, { map: "MYS" }) },
      ];

      let q3 = { "things.map": "USA" };
      let sifted3 = objects.filter(sift(q3));
      assert.deepEqual(sifted3, objects);
    });
  });

  describe("$where", function () {
    var couples = [
      {
        name: "SMITH",
        person: [
          {
            firstName: "craig",
            gender: "female",
            age: 29,
          },
          {
            firstName: "tim",
            gender: "male",
            age: 32,
          },
        ],
      },
      {
        name: "JOHNSON",
        person: [
          {
            firstName: "emily",
            gender: "female",
            age: 35,
          },
          {
            firstName: "jacob",
            gender: "male",
            age: 32,
          },
        ],
      },
    ];
  });

  describe("keypath", function () {
    var arr = [
      {
        a: {
          b: {
            c: 1,
            c2: 1,
          },
        },
      },
    ];
    it("can be used", function () {
      assert.equal(sift({ "a.b.c": 1 })(arr[0]), true);
    });
  });
});

var loremArr = [
  {
    num: 1,
    pum: 1,
    sub: {
      num: 1,
      pum: 1,
    },
  },
  {
    num: 2,
    pum: 2,
    sub: {
      num: 2,
      pum: 2,
    },
  },
  {
    num: 3,
    pum: 3,
    sub: {
      num: 3,
      pum: 3,
    },
  },
  {
    num: 4,
    pum: 4,
    sub: {
      num: 4,
      pum: 4,
    },
  },
  {
    num: 5,
    pum: 5,
    sub: {
      num: 5,
      pum: 5,
    },
  },
  {
    num: 6,
    pum: 6,
    sub: {
      num: 6,
      pum: 6,
    },
  },
  {
    num: 7,
    pum: 7,
    sub: {
      num: 7,
      pum: 7,
    },
  },
  {
    num: 8,
    pum: 8,
    sub: {
      num: 8,
      pum: 8,
    },
  },
  {
    num: 9,
    pum: 9,
    sub: {
      num: 9,
      pum: 9,
    },
  },
  {
    num: 10,
    pum: 10,
    sub: {
      num: 10,
      pum: 10,
    },
  },
  {
    num: 11,
    pum: 11,
    sub: {
      num: 10,
      pum: 10,
    },
  },
];
