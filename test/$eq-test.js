var sift   = require("..");
var assert = require("assert");

describe(__filename + "#", function() {

  it("can use different data types as the query and assert true", function() {
    assert.equal(sift(5)(5), true);
    assert.equal(sift(0)(0), true);
    assert.equal(sift(false)(0), false);
    assert.equal(sift(false)(false), true);
    assert.equal(sift(true)(false), false);
    assert.equal(sift(true)(true), true);
    assert.equal(sift(true)(false), false);
    assert.equal(sift("a")(true), false);
    assert.equal(sift("a")("a"), true);
    assert.equal(sift("true")(true), false);
    assert.equal(sift(1)(true), false);

    // this might need to return true below
    assert.equal(sift(null)(void 0), false);
    assert.equal(sift(void 0)(null), false);
    assert.equal(sift(null)(null), true);
    assert.equal(sift(void 0)(void 0), true);
  });

  it("can explicitly define $eq", function() {
    assert.equal(sift({$eq:5})(5), true);
  });

  it("can check keys for matching values", function() {
    assert.equal(sift({value:4})({value:4}), true);
    assert.equal(sift({value:6})({value:4}), false);
  });

  it("can validate key.paths", function() {
    assert.equal(sift({"a.b.c":4})({a:{b:{c:4}}}), true);
    assert.equal(sift({"a.b.c":4})({"a.b.c":4}), false);
  });

  it("can validate nested values", function() {
    assert.equal(sift({a:{b:{c:5}}})({a:{b:{c:5}}}), true);
  });

});
