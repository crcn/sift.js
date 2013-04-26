var expect = require("expect.js"),
sift = require(".."),
assert = require("assert");

describe("simple strings", function() {

  sift.use({
    operators: {
      notb: function(a, b) {
        return a != b ? 0 : -1;
      }
    }
  })

  var topic = [1, 2, 3, 4, 5, 6, 6, 4, 3];

  it("can use custom $notb operator", function() {
    expect(sift({$notb: 6 }, topic)).not.to.contain(6);
  });
});