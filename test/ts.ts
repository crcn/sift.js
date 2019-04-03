import sift from "..";

type File = {
  path: string;
};

// pass
sift<number>({ $in: [0, 1, 2] });
sift<number>({ $in: [0, 1, 2] });
sift<{ a: number }>({ $in: [{ a: 1 }, { a: 2 }] });
sift<{ a: number }>({ $and: [{ a: 1 }, { a: 2 }] });
sift<{ a: number }>({ $not: { $eq: { a: 5 } } });
sift<{ a: number; b: number }>({ a: 1 });
sift<{ a: number; b: number }>({ a: 1 });
sift<File>({
  path: { $regex: /^test/ }
})({ path: "a" });

// fail
sift<string>({ $in: [0, 1, 2] });
sift({ $in: [0, 1, 2] })("1");
sift<{ a: 1 }>({ $in: [{ a: 1 }, { a: 1, b: 2 }] });
