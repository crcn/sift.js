import sift from "..";

sift<any>({ $gt: 10 });
sift<string>({ $gt: "10" });
sift<Date>({ $gt: new Date(10) });

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
};

sift<Person>({ name: "a", $eq: 5, last: { $eq: 5 } });
