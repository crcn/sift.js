var expect = require("expect.js"),
sift = require("..");

describe("selector#", function () {


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
})