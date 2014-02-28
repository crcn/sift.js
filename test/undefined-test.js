var expect = require("expect.js"),
sift = require(".."),
assert = require("assert");

describe("simple strings", function() {

  var topic = [null, undefined, 0, { name: undefined }, { name: 0 }, { name: null }, { name: "craig" }, { name: null }];

  it("has $eq null count of 2", function() {
    assert.equal(sift({$eq:null}, topic).length, 2);
  });

  it("has null count of 2", function() {
    assert.equal(sift(null, topic).length, 2);
  });

  it("has $exists:true count of 6", function() {
    assert.equal(sift({$exists:true}, topic).length, 6);
  });

  it("has name:$exists:true count of 2", function() {
    assert.equal(sift({name:{$exists:true}}, topic).length, 2);
  })


  it("has name:$exists:false count of 3", function() {
    assert.equal(sift({name:{$exists:false}}, topic).length, 6);
  })

});