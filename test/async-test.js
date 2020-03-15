const assert = require("assert");
const sift = require("..");

describe(__filename + "#", () => {
  [
    [
      "can use a simple async $eq filter",
      {
        $eq: function(value) {
          return new Promise(function(resolve) {
            resolve(value > 2);
          });
        }
      },
      [1, 2, 3, 4, 5],
      [3, 4, 5]
    ]

    // [
    //   "can use a simple async $or filter",
    //   {
    //     $and: [
    //       function(value) {
    //         new Promise(function(resolve) {
    //           resolve(value > 2);
    //         })
    //       },
    //       function(value) {
    //         new Promise(function(resolve) {
    //           resolve(value < 5);
    //         })
    //       }
    //     ]
    // }, [1, 2, 3, 4, 5], [3, 4]]
  ].forEach(function([description, query, values, result]) {
    xit(description, function() {
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
