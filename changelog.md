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
  $operator: function(a) {
    return function(b) {
      // compare here
    };
  }
});
```

- all operators are traversable now
- fix #58.
