var expect = require("expect.js"),
sift = require(".."),
assert = require("assert");

describe("simple strings", function() {

  var topic = [null, undefined, 0, { name: undefined }, { name: 0 }];

  it("has $eq null count of 2", function() {
    assert.equal(sift({$eq:null}, topic).length, 2);
  });

  it("has null count of 2", function() {
    assert.equal(sift(null, topic).length, 2);
  });

});