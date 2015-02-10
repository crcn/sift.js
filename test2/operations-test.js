var expect = require("expect.js");
var sift   = require("../sift");

describe(__filename + "#", function () {


  [

    // $eq
    [{$eq:5}, [5,"5", 6], [5, "5"]],
    [{$eq:false}, [false,"false"], [false]],
    [{$eq:0}, [0,"0"], [0,"0"]],


  ].forEach(function (operation) {

    var filter = operation[0],
    array      = operation[1],
    matchArray = operation[2];

    it(JSON.stringify(filter), function () {
      var sifter = sift(filter);
      expect(JSON.stringify(sifter(array))).to.equal(JSON.stringify(matchArray));
    });
  });
});