import * as assert from "assert";
import sift from "..";

describe(__filename + "#", () => {
  [
    [
      "can use a simple async $eq filter",
      {
        $eq: function(value) {
          return value > 2;
        }
      },
      [1, 2, 3, 4, 5],
      [3, 4, 5]
    ],

    [
      "can use a simple async $in or filter",
      {
        $in: [
          function() {
            return 5;
          },
          function() {
            return Promise.resolve(2);
          }
        ]
      },
      [1, 2, 3, 4, 5],
      [2, 5]
    ],

    [
      "can use a simple async $and filter",
      {
        $and: [
          function(value) {
            return new Promise(function(resolve) {
              resolve(value > 2);
            });
          },
          function(value) {
            return new Promise(function(resolve) {
              resolve(value < 5);
            });
          }
        ]
      },
      [1, 2, 3, 4, 5],
      [3, 4]
    ],

    [
      "can use a simple async $or filter",
      {
        $or: [
          function(value) {
            return new Promise(function(resolve) {
              resolve(value !== 1);
            });
          },
          function(value) {
            return new Promise(function(resolve) {
              resolve(value < 5 && value !== 1);
            });
          }
        ]
      },
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5]
    ]
  ].forEach(function([description, query, values, result]) {
    it(description, function() {
      return new Promise(function(resolve, reject) {
        var filter = asyncFilter(sift(query));
        filter(values).then(function(filteredValues) {
          try {
            assert.equal(
              JSON.stringify(filteredValues),
              JSON.stringify(result)
            );
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });
});

function asyncFilter(filter) {
  return function(values) {
    return new Promise(function(resolve, reject) {
      Promise.all(values.map(filter)).then(function(filtered) {
        resolve(values.filter((value, index) => filtered[index]));
      });
    });
  };
}
