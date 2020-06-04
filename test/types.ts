import sift from "..";

sift<any>({ $gt: 10 });
sift<string>({ $gt: "10" });
sift<Date>({ $gt: new Date(10) });
sift<{}>({ $gt: "10" });
sift<[]>({ $eq: [] });

sift({ $gte: 10 });
sift({ $gte: "10" });
sift({ $gte: new Date(10) });

sift({ $lt: 10 });
sift({ $lt: "10" });
sift({ $lt: new Date(10) });

sift({ $lte: 10 });
sift({ $lte: "10" });
sift({ $lte: new Date(10) });

type Person = {
  name: string;
  last: string;
  address: {
    zip?: number;
  };
};

sift<Person>({ name: "a", last: { $eq: "a" } });

// fail
// sift<Person>({ name: 5, last: { $eq: "a" } });
sift<Person>({ name: "a", last: { $elemMatch: { $eq: "a" } } });
sift<Person>({ name: "a", address: { $elemMatch: { zip: 55124 } } });

// pass
sift<Person>({
  name: "a",
  address: { $elemMatch: {} },
  $or: [{ name: "jeffery", last: "joe" }]
});

type PersonSchema = Person & {
  "address.zip": number;
};

sift<Person, PersonSchema>({ "address.zip": 4 });

type Test2 = {
  name: string | number;
};

sift<Test2>({ name: 5 });
sift<Test2>({ name: { $gt: 10 } });

// fail
// sift<Something>({ name: { $gt: new Date(10) } });
sift<Test2>({ name: { $gt: "5" } });
