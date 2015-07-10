var sift   = require("..");
var assert = require("assert");

describe(__filename + "#", function() {
  it("can can compare a value against an $gt operation", function() {
    assert.equal(sift({$gt:0})(1), true);
  });
});
