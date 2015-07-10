var sift   = require("..");
var assert = require("assert");

describe(__filename + "#", function() {

  it("an assert $neq", function() {
    assert.equal(sift({$neq:5})(5), false);
    assert.equal(sift({$neq:5})(4), true);
    assert.equal(sift({$neq:void 0})(null), true);
    assert.equal(sift({$neq:void 0})(void 0), false);
    assert.equal(sift({$neq:0})(false), true);
  });

});
