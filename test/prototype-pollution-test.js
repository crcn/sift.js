const assert = require("assert");
const { default: sift } = require("../lib");

// Regression tests for CVE-2026-85625.
//
// sift enumerated query keys with `for..in`, which walks the prototype chain.
// If `Object.prototype` was polluted elsewhere in the process (e.g.
// `Object.prototype.$where = "..."`), every query - even `sift({})` - would
// pick up the inherited operator key and, for `$where`, compile the string
// with `new Function`, yielding arbitrary code execution.
//
// These run under the default config (string `$where` permitted) so they
// reproduce the original gadget: if the `for..in` guard regressed the
// inherited body would actually run.
describe(__filename + "#", function () {
  const polluters = ["$where", "$or", "$and", "$eq"];

  afterEach(function () {
    for (const key of polluters) {
      delete Object.prototype[key];
    }
  });

  it("ignores an inherited $where when filtering with a benign query", function () {
    let executed = false;
    global.__proto_pollution_poc = () => {
      executed = true;
    };
    Object.prototype.$where = "global.__proto_pollution_poc(); return true";

    const result = [1, 2, 3].filter(sift({}));

    delete global.__proto_pollution_poc;
    assert.equal(executed, false, "polluted $where must not be executed");
    assert.deepEqual(result, [1, 2, 3]);
  });

  it("ignores inherited operator keys in a nested query", function () {
    // If the guard regressed, this inherited $where would match-none.
    Object.prototype.$where = "false";
    const result = [{ a: 1 }, { a: 2 }].filter(sift({ a: 1 }));
    assert.deepEqual(result, [{ a: 1 }]);
  });

  it("still honors an own $where string (documented feature)", function () {
    const result = [{ v: 1 }, { v: 2 }].filter(sift({ $where: "obj.v === 1" }));
    assert.deepEqual(result, [{ v: 1 }]);
  });

  it("equality checks are unaffected by a polluted prototype", function () {
    Object.prototype.$eq = "injected";
    const result = [{ a: { b: 1 } }, { a: { b: 2 } }].filter(
      sift({ a: { b: 1 } }),
    );
    assert.deepEqual(result, [{ a: { b: 1 } }]);
  });
});
