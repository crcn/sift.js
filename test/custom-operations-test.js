import * as assert from "assert";
import sift from "..";

describe(__filename + "#", () => {
  it("can add a custom $mod operation", function() {
    var filter = sift(
      { $mod2: 2 },
      {
        expressions: {
          $mod2: function(a, b) {
            return Boolean(a % b);
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
