// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// var __1 = require("..");
// // pass
// __1.default({ $in: [0, 1, 2] });
// __1.default({ $in: [0, 1, 2] });
// __1.default({ $in: [{ a: 1 }, { a: 2 }] });
// __1.default({ $and: [{ a: 1 }, { a: 2 }] });
// __1.default({ $not: { $eq: { a: 5 } } });
// __1.default({ a: 1 });
// __1.default({ a: 1 });
// __1.default({
//   path: { $regex: /^test/ }
// })({ path: "a" });
// // fail
// __1.default({ $in: [0, 1, 2] });
// __1.default({ $in: [0, 1, 2] })("1");
// __1.default({ $in: [{ a: 1 }, { a: 1, b: 2 }] });
