const assert = require("assert");
const sift = require("..");

describe(__filename + "#", () => {
  xit("can add a custom $mod operation", function() {
    var filter = sift(
      { $mod2: 2 },
      {
        expressions: {
          $mod2: params => item => {
            return Boolean(params % item);
          }
        }
      }
    );

    var values = [1, 2, 3, 4, 5];

    assert.equal(
      JSON.stringify(values.filter(filter)),
      JSON.stringify([3, 4, 5])
    );
  });
});
