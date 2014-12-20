var expect = require("expect.js"),
sift = require("..");

describe(__filename + "#", function() {

  it("can use custom operators", function () {

    var i = 0;

    sift.use({
      operators: {
        abba: function (a, b) {
          i++;
        }
      }
    });

    sift({ a: {$abba:-1}}, [1,2,3]);

    expect(i).to.be(3);
  });

  it("can use a function", function (next) {
    sift.use(function (sift) {
      expect(sift(1,[1,2,3]).length).to.be(1);
      next();
    })
  });


});