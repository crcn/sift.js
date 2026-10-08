## 17.1.4

- Fix https://github.com/crcn/sift.js/issues/276: ignore query keys and options inherited from a polluted `Object.prototype`, so pollution elsewhere in a process can no longer inject a string `$where` into queries (code execution) or break them (#277, thanks @sheanming-agmo). A string `$where` in the query itself still runs as code: see the README before passing untrusted queries to sift.
- Fix https://github.com/crcn/sift.js/issues/273: `$ne`, `$in`, `$nin` and `$exists` on paths through arrays. Results change where 17.1.3 was wrong, e.g. `{ "a.b": { $nin: [2] } }` no longer matches `{ a: [{ b: 1 }, { b: 2 }] }`, and `{ "a.b": { $exists: false } }` no longer matches arrays whose elements have `b`. `$exists` also treats `1`/`0` like `true`/`false`.
- Fix https://github.com/crcn/sift.js/issues/272: string `$where` where `process` isn't defined (browsers).
- Fix https://github.com/crcn/sift.js/issues/275: types for union-typed and readonly array properties.
- https://github.com/crcn/sift.js/issues/274: document the `compare` option for custom equality.
- Fix `$elemMatch` only checking the first candidate array, e.g. each `a[i].b` for `"a.b"`.
- Known issue: null checks (`$ne: null`, `$in: [null]`, `$exists: false`) on an index path below an array of documents, e.g. `{ "orders.items.0": { $ne: null } }`, can differ from MongoDB.

## 17.0.0

- Fix https://github.com/crcn/sift.js/issues/243
- Fix https://github.com/crcn/sift.js/issues/242

## 16.0.0

- Fix https://github.com/crcn/sift.js/issues/242
- Fix https://github.com/crcn/sift.js/issues/243

## 15.1.0

- Fix https://github.com/crcn/sift.js/issues/239

## 15.0.0

- Fix https://github.com/crcn/sift.js/issues/236

## 14.0.3

- Fix https://github.com/crcn/sift.js/issues/231

## 14.0.0

- Fix https://github.com/crcn/sift.js/issues/227
- Fix https://github.com/crcn/sift.js/issues/228
-

## 13.1.0

- Added stronger types for queries: https://github.com/crcn/sift.js/issues/197

## 13.0.0

- Fix behavior discrepancy with Mongo: https://github.com/crcn/sift.js/issues/196

## 12.0.0

- Fix bug where \$elemMatch tested objects: e.g: `sift({a: {$elemMatch: 1}})({ a: { b: 1}})`. \$elemMatch now expects arrays based on Mongodb syntax. E.g: `sift({a: {$elemMatch: 1}})({ a: { b: 1}})`

## 11.0.0

- new custom operations syntax (see API readme)
- null & undefined are not treated equally (change has been added to keep spec as functionality as possible to MongoDB)
- `select` option has been removed
- `compare` option now expects `boolean` return value instead of an integer
- nested queries are no-longer supported
- `expressions` option is now `operations`
- `operations` parameter now expects new operations API
- ImmutableJS support removed for now
- Remove bower support

## 9.0.0

- (behavior change) toJSON works for vanilla objects.

## 8.5.1

- Fix dependency vulnerability
- Fix #158

## 8.5.0

- Added `comparable` option (fix https://github.com/crcn/sift.js/issues/156)

## 8.4.0

- Added `compare` option (fix https://github.com/crcn/sift.js/issues/155)

## 8.3.2

- Query _properties_ now excpect exact object shape (based on https://github.com/crcn/sift.js/issues/152). E.g: `[{a: { b: 1}}, {a: { b: 1, c: 2}}]].filter(sift({ a: { b: 1} })) === [{a: {b: 1}]`, and `[{a: 1, b: 1}, {a: 1}]].filter(sift({ a: 1 })) === [{a: 1, b: 1}, {a: 1}]`.

## 8.0.0

- DEPRECATED `indexOf` in favor of `array.findIndex(sift(query))`
- second param is now `options` instead of select function. E.g: `sift(query, { expressions: customExpressions, select: selectValue })`
- DEPRECATED `sift(query, array)`. You must now use `array.filter(sift(query))`
- Queries now expect exact object shape (based on https://github.com/crcn/sift.js/issues/117). E.g: `[{a: 1, b: 1}, {a: 1}]].filter(sift({ a: 1 })) === [{a: 1}]`

### 7.0.0

- Remove global `*.use()` function.
- converted to ES6

### 3.3.x

- `$in` now uses `toString()` when evaluating objects. Fixes #116.

#### 2.x

- `use()` now uses a different format:

```javascript
sift.use({
  $operator: function (a) {
    return function (b) {
      // compare here
    };
  },
});
```

- all operators are traversable now
- fix #58.
