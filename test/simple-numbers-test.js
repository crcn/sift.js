var expect = require("expect.js"),
sift = require(".."),
assert = require("assert");

describe("simple numbers", function() {

  var topic = [0, 100, 200, 300, 400, 500, 600, 700, 800];

  it("has sifted < 200 count of 2", function() {
    assert.equal(sift({$lt:200}, topic).length , 2);
  });

  it("has sifted <= 200 count of 3", function() {
    assert.equal(sift({$lte:200}, topic).length , 3);
  });

  it("has sifted > 200 count of 6", function() {
    assert.equal(sift({$gt:200}, topic).length , 6);
  });

  it("has sifted >= 200 count of 7", function() {
    assert.equal(sift({$gte:200}, topic).length , 7);
  });

  it("has a sifted modulus 3 count of 3", function() {
    assert.equal(sift({$mod:[3,0]}, topic).length , 3);
  });

});