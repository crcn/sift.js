import * as assert from "assert";
import sift from "..";
var ObjectID = require("bson").ObjectID;

describe(__filename + "#", function() {
  [
    [{ $lt: new Date() }, [null], []],

    // $eq
    [{ $eq: 5 }, [5, "5", 6], [5]],
    [
      { a: { $eq: { b: 1 } } },
      [{ a: { b: 1 } }, { a: { b: 1, c: 2 } }],
      [{ a: { b: 1 } }]
    ],
    ["5", [5, "5", 6], ["5"]],
    [false, [false, "false", true], [false]],
    [true, [1, true], [true]],
    [0, [0, "0"], [0]],
    [null, [null], [null]],
    [undefined, [undefined, null], [undefined, null]],
    [{ aaaaa: { $nin: [null] } }, [{ root: { defined: 1337 } }], []],
    [1, [2, 3, 4, 5], []],
    [1, [[1]], [[1]]],
    [
      new Date(1),
      [new Date(), new Date(1), new Date(2), new Date(3)],
      [new Date(1)]
    ],
    [/^a/, ["a", "ab", "abc", "b", "bc"], ["a", "ab", "abc"]],

    [
      function(b) {
        return b === 1;
      },
      [1, 2, 3],
      [1]
    ],

    [
      new ObjectID("54dd5546b1d296a54d152e84"),
      [new ObjectID(), new ObjectID("54dd5546b1d296a54d152e84")],
      [new ObjectID("54dd5546b1d296a54d152e84")]
    ],

    // check for exactness
    [
      { c: { d: "d" } },
      [
        { a: "done", c: { d: "d" } },
        { c: { d: "d" } },
        { c: { d: "d", e: "f" } }
      ],
      [{ a: "done", c: { d: "d" } }, { c: { d: "d" } }]
    ],

    [
      { a: 1 },
      [{ a: 1 }, { a: 2 }, { a: 1, b: 2 }],
      [{ a: 1 }, { a: 1, b: 2 }]
    ],

    [
      { a: { c: 1 } },
      [{ a: { c: 1 } }, { a: { c: 1, d: 1 } }],
      [{ a: { c: 1 } }]
    ],

    [
      { a: [1, 2, 3] },
      [{ a: 1 }, { a: [1, 2] }, { a: [1, 2, 3], c: 2 }],
      [{ a: [1, 2, 3], c: 2 }]
    ],

    [
      { a: [{ b: 1 }, { b: 2 }] },
      [{ a: [{ b: 1 }, { b: 2 }] }, { a: [{ b: 1 }] }, { a: [{ b: 1 }], b: 2 }],
      [{ a: [{ b: 1 }, { b: 2 }] }]
    ],
    [
      {
        educations: {
          $elemMatch: {
            $or: [
              {
                value: "refa",
                $or: [{ unfinished: true }]
              },
              {
                value: "reno",
                $or: [{ unfinished: true }]
              }
            ]
          }
        }
      },
      [
        {
          educations: [
            { value: "refa", unfinished: true },
            { value: "reno", unfinished: true }
          ]
        }
      ],
      [
        {
          educations: [
            { value: "refa", unfinished: true },
            { value: "reno", unfinished: true }
          ]
        }
      ]
    ],
    // $ne
    [{ $ne: 5 }, [5, "5", 6], ["5", 6]],
    [{ $ne: "5" }, ["5", 6], [6]],
    [{ $ne: false }, [false], []],
    [{ $ne: undefined }, [false, 0, "0", undefined], [false, 0, "0"]],
    [{ $ne: /^a/ }, ["a", "ab", "abc", "b", "bc"], ["b", "bc"]],
    [{ $ne: 1 }, [[2], [1]], [[2]]],
    [
      { groups: { $ne: 111 } },
      [{ groups: [111, 222, 333, 444] }, { groups: [222, 333, 444] }],
      [{ groups: [222, 333, 444] }]
    ],

    // $lt
    [{ $lt: 5 }, [3, 4, 5, 6], [3, 4]],
    [{ $lt: "c" }, ["a", "b", "c"], ["a", "b"]],
    [{ $lt: "5" }, [4, 3, 2, 1], []],
    [{ $lt: null }, [-3, -4], []],
    [{ $lt: new Date() }, [null], []],
    [{ $lt: new Date() }, [new Date("2010-01-01")], [new Date("2010-01-01")]],
    [
      { $lt: new Date(3) },
      [new Date(1), new Date(2), new Date(3)],
      [new Date(1), new Date(2)]
    ],

    // $lte
    [{ $lte: 5 }, [3, 4, 5, 6], [3, 4, 5]],
    [{ $lte: "5" }, [4, 3, 2, 1], []],
    [{ $lte: "5" }, ["4", "3", "2"], ["4", "3", "2"]],
    [
      { groups: { $lt: 5 } },
      [{ groups: [1, 2, 3, 4] }, { groups: [7, 8] }],
      [{ groups: [1, 2, 3, 4] }]
    ],

    // $gt
    [{ $gt: 5 }, [3, 4, 5, 6], [6]],
    [{ $gt: null }, [3, 4], []],
    [{ $gt: "5" }, [6, 7, 8], []],
    [{ $gt: "5" }, ["6", "7", "8"], ["6", "7", "8"]],
    [
      { groups: { $gt: 5 } },
      [{ groups: [1, 2, 3, 4] }, { groups: [7, 8] }],
      [{ groups: [7, 8] }]
    ],

    // $gte
    [{ $gte: 5 }, [3, 4, 5, 6], [5, 6]],
    [{ $gte: "5" }, [4, 3, 2, 1], []],
    [
      { groups: { $gte: 5 } },
      [{ groups: [1, 2, 3, 4] }, { groups: [7, 8] }],
      [{ groups: [7, 8] }]
    ],

    // $mod
    [{ $mod: [2, 1] }, [1, 2, 3, 4, 5, 6], [1, 3, 5]],
    [
      { groups: { $mod: [2, 0] } },
      [{ groups: [1, 2, 3, 4] }, { groups: [7, 9] }],
      [{ groups: [1, 2, 3, 4] }]
    ],

    // $exists
    [{ $exists: false }, [0, false, undefined, null], []],
    [
      { $exists: true },
      [0, false, undefined, 1, {}],
      [0, false, undefined, 1, {}]
    ],
    [
      { "a.b": { $exists: true } },
      [{ a: { b: "exists" } }, { a: { c: "does not exist" } }],
      [{ a: { b: "exists" } }]
    ],

    [
      { field: { $exists: false } },
      [
        { a: 1 },
        { a: 2, field: 5 },
        { a: 3, field: 0 },
        { a: 4, field: undefined },
        { a: 5 }
      ],
      [{ a: 1 }, { a: 5 }]
    ],

    // based on https://github.com/crcn/sift.js/issues/146
    [
      { "formData.kg": { $exists: true } },
      [{ formData: { kg: null } }, { a: 1 }],
      [{ formData: { kg: null } }]
    ],

    // $in
    // TODO - {$in:[Date]} doesn't work - make it work?
    [{ $in: [0, false, 1, "1"] }, [0, 1, 2, 3, 4, false], [0, 1, false]],
    [{ $in: [1, "1", "2"] }, ["1", "2", "3"], ["1", "2"]],
    [{ $in: [new Date(1)] }, [new Date(1), new Date(2)], [new Date(1)]],
    [
      { "a.b.status": { $in: [0] } },
      [{ a: { b: [{ status: 0 }] } }, { a: { b: [{ status: 2 }] } }],
      [{ a: { b: [{ status: 0 }] } }]
    ],
    [
      { "a.b.status": { $in: [0, 2] } },
      [{ a: { b: [{ status: 0 }] } }, { a: { b: [{ status: 2 }] } }],
      [{ a: { b: [{ status: 0 }] } }, { a: { b: [{ status: 2 }] } }]
    ],
    [
      { x: { $in: [{ $regex: ".*aaa.*" }, { $regex: ".*bbb.*" }] } },
      [{ x: { b: "aaa" } }, { x: "bbb" }, { x: "ccc" }, { x: "aaa" }],
      [{ x: "bbb" }, { x: "aaa" }]
    ],
    [
      { x: { $in: [/.*aaa.*/, /.*bbb.*/] } },
      [{ x: { b: "aaa" } }, { x: "bbb" }, { x: "ccc" }, { x: "aaa" }],
      [{ x: "bbb" }, { x: "aaa" }]
    ],

    // $nin
    [{ $nin: [0, false, 1, "1"] }, [0, 1, 2, 3, 4, false], [2, 3, 4]],
    [{ $nin: [1, "1", "2"] }, ["1", "2", "3"], ["3"]],
    [{ $nin: [new Date(1)] }, [new Date(1), new Date(2)], [new Date(2)]],
    [
      { "root.notDefined": { $nin: [1, 2, 3] } },
      [{ root: { defined: 1337 } }],
      [{ root: { defined: 1337 } }]
    ],
    [
      { "root.notDefined": { $nin: [1, 2, 3, null] } },
      [{ root: { defined: 1337 } }],
      []
    ],
    [{ aaaaa: { $nin: [null] } }, [{ root: { defined: 1337 } }], []],
    [
      { x: { $nin: [{ $regex: ".*aaa.*" }, { $regex: ".*bbb.*" }] } },
      [{ x: { b: "aaa" } }, { x: "bbb" }, { x: "ccc" }, { x: "aaa" }],
      [{ x: { b: "aaa" } }, { x: "ccc" }]
    ],
    [
      { x: { $nin: [/.*aaa.*/, /.*bbb.*/] } },
      [{ x: { b: "aaa" } }, { x: "bbb" }, { x: "ccc" }, { x: "aaa" }],
      [{ x: { b: "aaa" } }, { x: "ccc" }]
    ],

    // $not
    [{ $not: false }, [0, false], [0]],
    [{ $not: 0 }, [0, false, 1, 2, 3], [false, 1, 2, 3]],
    [{ $not: { $in: [1, 2, 3] } }, [1, 2, 3, 4, 5, 6], [4, 5, 6]], // with expressions

    // $type
    [{ $type: Date }, [0, new Date(1)], [new Date(1)]],
    [{ $type: Number }, [0, false, 1], [0, 1]],
    [{ $type: Boolean }, [0, false, undefined], [false]],
    [{ $type: String }, ["1", 1, false], ["1"]],

    // $all
    [{ $all: [1, 2, 3] }, [[1, 2, 3, 4], [1, 2, 4]], [[1, 2, 3, 4]]],
    [
      { $all: [0, false] },
      [[0, 1, 2], [0, false], ["0", "false"], undefined],
      [[0, false]]
    ],
    [{ $all: ["1"] }, [[1]], []],
    [
      { $all: [new Date(1), new Date(2)] },
      [[new Date(1), new Date(2)], [new Date(1)]],
      [[new Date(1), new Date(2)]]
    ],

    // https://github.com/crcn/sift.js/issues/160
    [
      { "order.items.product": { $all: ["poster", "frame"] } },
      [
        {
          order: {
            id: "or_0001",
            amount: 6000,
            items: [
              {
                product: "poster",
                sku: "P18x24",
                quantity: 1,
                amount: 3000
              },
              {
                product: "frame",
                sku: "P18x24",
                quantity: 1,
                amount: 3000
              },
              {
                product: "shipping",
                sku: "shipping",
                quantity: 1,
                amount: 5000
              }
            ]
          }
        }
      ],
      [
        {
          order: {
            id: "or_0001",
            amount: 6000,
            items: [
              {
                product: "poster",
                sku: "P18x24",
                quantity: 1,
                amount: 3000
              },
              {
                product: "frame",
                sku: "P18x24",
                quantity: 1,
                amount: 3000
              },
              {
                product: "shipping",
                sku: "shipping",
                quantity: 1,
                amount: 5000
              }
            ]
          }
        }
      ]
    ],
    [
      {
        "array.value": 1
      },
      [
        {
          array: [{ value: 1 }, { value: 2 }]
        }
      ],
      [
        {
          array: [{ value: 1 }, { value: 2 }]
        }
      ]
    ],
    // $size
    [{ $size: 3 }, ["123", [1, 2, 3], "1"], ["123", [1, 2, 3]]],
    [{ $size: 1 }, ["123", [1, 2, 3], "1", undefined], ["1"]],

    // $or
    [{ $or: [1, 2, 3] }, [1, 2, 3, 4], [1, 2, 3]],
    [{ $or: [{ $ne: 1 }, 2] }, [1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6]],
    [
      { $or: [{ a: 1 }, { b: 1 }] },
      [{ a: 1, b: 2 }, { a: 1 }],
      [{ a: 1, b: 2 }, { a: 1 }]
    ],

    // $nor
    [{ $nor: [1, 2, 3] }, [1, 2, 3, 4], [4]],
    [{ $nor: [{ $ne: 1 }, 2] }, [1, 2, 3, 4, 5, 6], [1]],
    [
      { $nor: [{ a: 1 }, { b: 1 }] },
      [{ a: 1, b: 2 }, { a: 1 }, { c: 1 }],
      [{ c: 1 }]
    ],

    // $and
    [{ $and: [{ $gt: 1 }, { $lt: 4 }] }, [1, 2, 3, 4], [2, 3]],
    [
      {
        $and: [{ field: { $not: { $type: String } } }, { field: { $ne: null } }]
      },
      [{ a: 1, field: 1 }, { a: 2, field: "2" }],
      [{ a: 1, field: 1 }]
    ],

    // $regex
    [{ $regex: "^a" }, ["a", "ab", "abc", "bc", "bcd"], ["a", "ab", "abc"]],
    [
      { a: { $regex: "b|c" } },
      [{ a: ["b"] }, { a: ["c"] }, { a: "c" }, { a: "d" }],
      [{ a: ["b"] }, { a: ["c"] }, { a: "c" }]
    ],
    [
      { folder: { $regex: "^[0-9]{4}$" } },
      [{ folder: ["1234", "3212"] }],
      [{ folder: ["1234", "3212"] }]
    ],

    // $options
    [
      { $regex: "^a", $options: "i" },
      ["a", "Ab", "abc", "bc", "bcd"],
      ["a", "Ab", "abc"]
    ],
    [
      { text: { $regex: ".*lis.*", $options: "i" } },
      [{ text: ["Bob", "Melissa", "Joe", "Sherry"] }],
      [{ text: ["Bob", "Melissa", "Joe", "Sherry"] }]
    ],

    // undefined
    [{ $regex: "a" }, [undefined, null, true, false, 0, "aa"], ["aa"]],
    [/a/, [undefined, null, true, false, 0, "aa"], ["aa"]],
    [/.+/, [undefined, null, true, false, 0, "aa", {}], ["aa"]],

    // Multiple conditions on an undefined root
    [
      { "a.b": { $exists: true, $nin: [null] } },
      [{ a: { b: "exists" } }, { a: { c: "does not exist" } }],
      [{ a: { b: "exists" } }]
    ],

    // $where
    [
      {
        $where: function() {
          return this.v === 1;
        }
      },
      [{ v: 1 }, { v: 2 }],
      [{ v: 1 }]
    ],
    [{ $where: "this.v === 1" }, [{ v: 1 }, { v: 2 }], [{ v: 1 }]],
    [{ $where: "obj.v === 1" }, [{ v: 1 }, { v: 2 }], [{ v: 1 }]],

    // $elemMatch
    //{'person': {'$elemMatch': {'gender': 'male', 'age': {'$lt': 30}}}}
    [
      { a: { $elemMatch: { b: 1, c: 2 } } },
      [
        { a: { b: 1, c: 2 } },
        { a: [{ b: 1, c: 2, d: 3 }] },
        { a: { b: 2, c: 3 } }
      ],
      [{ a: { b: 1, c: 2 } }, { a: [{ b: 1, c: 2, d: 3 }] }]
    ],
    [
      { a: { $elemMatch: { b: 2, c: { $gt: 2 } } } },
      [
        { a: { b: 1, c: 2 } },
        { a: { b: 1, c: 2, d: 3 } },
        [{ a: { b: 2, c: 3 } }]
      ],
      [[{ a: { b: 2, c: 3 } }]]
    ],
    [
      { tags: { $all: [{ $elemMatch: { a: 1 } }] } },
      [{ tags: [{ a: 1 }] }, { tags: [{ a: 1 }, { b: 1 }] }],
      [{ tags: [{ a: 1 }] }, { tags: [{ a: 1 }, { b: 1 }] }]
    ],
    [
      { tags: { $elemMatch: { a: 1 } } },
      [{ tags: [{ a: 1 }] }, { tags: [{ a: 1 }, { b: 1 }] }],
      [{ tags: [{ a: 1 }] }, { tags: [{ a: 1 }, { b: 1 }] }]
    ],

    // dot-notation
    [
      { "a.b": /c/ },
      [
        { a: { b: "c" } },
        { a: { b: "cd" } },
        { "a.b": "c" },
        { a: { b: "e" } }
      ],
      [{ a: { b: "c" } }, { a: { b: "cd" } }]
    ],
    [
      { "foo.0": "baz" },
      [{ foo: ["bar", "baz"] }, { foo: ["baz", "bar"] }],
      [{ foo: ["baz", "bar"] }]
    ],
    [
      { "foo.0.name": "baz" },
      [
        { foo: [{ name: "bar" }, { name: "baz" }] },
        { foo: [{ name: "baz" }, { name: "bar" }] }
      ],
      [{ foo: [{ name: "baz" }, { name: "bar" }] }]
    ],

    // object.toString() tests
    // [
    //   {
    //     $in: [
    //       {
    //         toString: function() {
    //           return "a";
    //         }
    //       }
    //     ]
    //   },
    //   [
    //     {
    //       toString: function() {
    //         return "a";
    //       }
    //     },
    //     {
    //       toString: function() {
    //         return "b";
    //       }
    //     }
    //   ],
    //   [
    //     {
    //       toString: function() {
    //         return "a";
    //       }
    //     }
    //   ]
    // ],
    [{ $in: [{}] }, [{}, {}], [{}, {}]],

    // based on https://gist.github.com/jdnichollsc/00ea8cf1204b17d9fb9a991fbd1dfee6
    [
      {
        $and: [
          { "a.s": { $lte: new Date("2017-01-29T05:00:00.000Z") } },
          { "a.e": { $gte: new Date("2017-01-08T05:00:00.000Z") } }
        ]
      },
      [
        {
          a: {
            s: new Date("2017-01-13T05:00:00.000Z"),
            e: new Date("2017-01-31T05:00:00.000Z")
          }
        }
      ],
      [
        {
          a: {
            s: new Date("2017-01-13T05:00:00.000Z"),
            e: new Date("2017-01-31T05:00:00.000Z")
          }
        }
      ]
    ]
  ].forEach(function(operation, i) {
    var filter = operation[0];
    var array = operation[1];
    var matchArray = operation[2];

    it(i + ": " + JSON.stringify(filter), function() {
      assert.equal(
        JSON.stringify(array.filter(sift(filter))),
        JSON.stringify(matchArray)
      );
    });
  });
});
