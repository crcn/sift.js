var expect = require("expect.js"),
sift = require("..");

describe(__filename + "#", function() {

  it("doesn't sort arrays", function () {
    var values = sift({
      $or: [3, 2, 1]
    }, [9,8,7,6,5,4,3,2,1]);

    expect(values.length).to.be(3);
    expect(values[0]).to.be(3);
    expect(values[1]).to.be(2);
    expect(values[2]).to.be(1);
  });
});
