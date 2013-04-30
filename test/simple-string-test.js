var expect = require("expect.js"),
sift = require(".."),
assert = require("assert");

describe("simple strings", function() {


  var topic = ['craig','john','jake','joe', null];

  it("has a sifted $in count of 3", function() {
    expect(sift({$in:['craig','john','joe']}, topic).length).to.be(3);
  });

  it("has a sifted $nin count of 2", function() {
    expect(sift({$nin:['craig','john','joe']}, topic).length).to.be(2);
  });

  it("has a sifted $exists count of 4", function() {
    expect(sift({$exists:true}, topic).length).to.be(4);
  });

  it("has a sifted $and count of 1", function() {
    expect(sift({$and:['craig']}, topic).length).to.be(1);
  });

  it("has a sifted $ne count of 4", function() {
    assert.equal(sift({$ne:null}, topic).length , 4);
  });

  it("has a sifted regexp $eq count of 3", function() {
    assert.equal(sift(/^j\w+$/, topic).length , 3);
  });

  it("has a sifted function count of 2", function() {
    expect(sift(function(value) { return value && value.length == 4 }, topic).length == 2).to.be(true);
  });

  it("has a sifted type string of 4", function() {
    assert.equal(sift({ $type: String }, topic).length, 4);
  })

  it("has a sifted $or count of 2", function() {
    assert.equal(sift({$or:['craig','jake']}, topic).length, 2);
  });

  it("has a sifted $nor count of 5", function() {
    assert.equal(sift({$nor:topic}, topic).length , 0);
  });

  it("has a sifted $not count of 3", function() {
    assert.equal(sift({$not:{$in:['craig','john']}}, topic).length, 3); 
  });

  it("has a sifted $size of 2", function() {
    assert.equal(sift({$size:4}, topic).length, 2);
  });
});