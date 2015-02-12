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


  it("can make a traversable op", function () {

    var i = 0;

    sift.use({
      operators: {
        baab: {
          traverse:true,
          test: function (a, b) {
            i++;
            return a && b;
          }
        }
      }
    });

    sift({a:{$baab:1}}).test({a:1});
    expect(i).to.be(1);
  });


  sift.use({
    operators: {
      notb: function(a, b) {
        return a != b ? 0 : -1;
      }
    }
  });


  var topic = [1, 2, 3, 4, 5, 6, 6, 4, 3];

  it("can use custom $notb operator", function() {
    expect(sift({$notb: 6 }, topic)).not.to.contain(6);
  });


});