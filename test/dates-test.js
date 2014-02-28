var expect = require("expect.js"),
sift = require(".."),
assert = require("assert");

describe("simple strings", function() {

  var topic = [new Date(), new Date(1325314860361), new Date(Date.now()+1000), new Date(Date.now()+2000)];

  it("has $eq date count of 1", function() {
    assert.equal(sift(new Date(1325314860361), topic).length , 1);
  });

  it("has $type count of 4", function() {
    assert.equal(sift({ $type: Date }, topic).length , 4);
  });

  it("has $gt date count of 2", function() {
    assert.equal(sift({ $gt: Date.now() }, topic).length , 2);
  });

});