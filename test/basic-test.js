var assert = require("assert"),
sift = require("..");

describe(__filename + "#", function() {

  it("doesn't sort arrays", function () {
    var values = sift({
      $or: [3, 2, 1]
    }, [9,8,7,6,5,4,3,2,1]);


    assert.equal(values.length, 3);
    assert.equal(values[0], 3);
    assert.equal(values[1], 2);
    assert.equal(values[2], 1);
  });

  it("can create a custom selector, and use it", function () {
    var sifter = sift({ age: { $gt: 5}}, function (item) {
      return item.person;
    });

    var people = [{ person: { age: 6 }}],
    filtered = people.filter(sifter);


    assert.equal(filtered.length, 1);
    assert.equal(filtered[0], people[0]);
  });

  it("throws an error if the selector is invalid", function () {
    
    var err;
    try {
      sift({$aaa:1}, 1)("b");
    } catch (e) {
      err = e;
    }

    assert.equal(err.message, "Unknown sift selector 1");

  });

  it("can use a custom selector as the 3rd param", function () {

    var people = [{ person: { age: 6 }}];

    var filtered = sift({ age: { $gt: 5}}, people, function (item) {
      return item.person;
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0], people[0]);
  });

  it("throws an error", function () {
    var err;
    try {
      sift({$aaa:1})("b");
    } catch (e) {
      err = e;
    }

    assert.equal(err.message, "Unknown operator $aaa.");
  });

  it("can get the first index of a matching element", function () {
    var index = sift.indexOf({ val: { $gt: 5}}, [{val: 4}, {val: 3}, {val: 6}, {val: 7}]);

    assert.equal(index, 2);
  });

  it("returns -1 as index if no matching element is found", function () {
    var index = sift.indexOf({ val: { $gt: 7}}, [{val: 4}, {val: 3}, {val: 6}, {val: 7}]);

    assert.equal(index, -1);
  });
});
