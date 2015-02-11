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

  it("can create a custom selector, and use it", function () {
    var sifter = sift({ age: { $gt: 5}}, function (item) {
      return item.person;
    });

    var people = [{ person: { age: 6 }}],
    filtered = sifter(people);


    expect(filtered.length).to.be(1);
    expect(filtered[0]).to.be(people[0]);
  });

  it("can use a custom selector as the 3rd param", function () {

    var people = [{ person: { age: 6 }}];

    var filtered = sift({ age: { $gt: 5}}, people, function (item) {
      return item.person;
    });

    expect(filtered.length).to.be(1);
    expect(filtered[0]).to.be(people[0]);
  })
});
