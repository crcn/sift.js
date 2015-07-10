var sift   = require("..");
var assert = require("assert");

describe(__filename + "#", function() {
  it("can can compare a value against an $or operation", function() {
    assert.equal(sift({$or:[0, void 0, null]})(void 0), true);
    assert.equal(sift({$or:[0, void 0, null]})(false), false);
    assert.equal(sift({$or:[{$eq:0}, void 0, null]})(0), true);

    var values = sift({
      $or: [3, 2, 1]
    }, [9, 8, 7, 6, 5, 4, 3, 2, 1]);

    assert.equal(values.length, 3);
    assert.equal(values[0], 3);
    assert.equal(values[1], 2);
    assert.equal(values[2], 1);
  });
});
